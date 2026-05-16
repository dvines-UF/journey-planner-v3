import { eventBus } from './eventBus.js';
import { generateId } from './utils.js';

/**
 * JourneyState: The Source of Truth.
 * Adheres strictly to the SCHEMA.md data contracts.
 * Modifies state and immediately broadcasts changes via eventBus.
 */
class JourneyState {
  constructor() {
    this.journeys = [];
    this.activeJourneyId = null;
    this.focusedDayId = null; 
    this.storageKey = 'journey_planner_collection_v3';
    
    eventBus.on('DAYS_REORDERED', this.reorderDays.bind(this));
  }
  
  /**
   * Set the currently focused day in the timeline
   */
  setFocusedDay(dayId) {
    this.focusedDayId = dayId;
    eventBus.emit('DAY_FOCUSED', { dayId });
  }

  /**
   * Ensure any incoming pick data meets the schema
   */
  sanitizePick(pick) {
    return {
      id: pick.id || generateId('p'),
      name: (pick.name || 'New Discovery').substring(0, 100),
      type: ['dining', 'sight', 'trail', 'wine', 'tour', 'leisure'].includes(pick.type) ? pick.type : 'sight',
      notes: (pick.notes || '').substring(0, 500),
      vibe_reasoning: (pick.vibe_reasoning || '').substring(0, 500)
    };
  }

  /**
   * The current active journey object
   */
  get activeJourney() {
    return this.journeys.find(j => j.id === this.activeJourneyId) || null;
  }

  /** Alias for activeJourney to support existing code */
  get journey() {
    return this.activeJourney;
  }

  /**
   * Load journeys from localStorage
   */
  loadFromLocal() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) {
      eventBus.emit('JOURNEY_LOADED', { journey: null });
      return false;
    }

    try {
      const parsed = JSON.parse(data);
      
      // Legacy Migration Logic: Wrap old single-trip format
      if (parsed.days && !parsed.journeys) {
        console.log('JourneyState: Migrating legacy data...');
        const legacyJourney = {
          ...parsed,
          id: 'legacy-' + Date.now(),
          status: 'planning',
          createdAt: Date.now(),
          lastModified: Date.now()
        };
        this.journeys = [legacyJourney];
        this.activeJourneyId = legacyJourney.id;
        this.save();
      } else {
        this.journeys = (parsed.journeys || []).map(j => ({
          ...j,
          days: (j.days || []).map(d => ({
            ...d,
            picks: (d.picks || []).map(p => this.sanitizePick(p)),
            transit: d.transit || []
          }))
        }));
        this.activeJourneyId = parsed.activeJourneyId || (this.journeys.length > 0 ? this.journeys[0].id : null);
      }

      eventBus.emit('JOURNEYS_UPDATED', { journeys: this.journeys });
      
      if (this.activeJourneyId) {
        eventBus.emit('JOURNEY_LOADED', { journey: this.activeJourney });
      }
      return true;
    } catch (e) {
      console.error('Failed to load journeys', e);
      return false;
    }
  }

  /**
   * Persist journeys to localStorage
   */
  save() {
    this.refreshTransit();
    localStorage.setItem(this.storageKey, JSON.stringify({
      journeys: this.journeys,
      activeJourneyId: this.activeJourneyId
    }));
    eventBus.emit('JOURNEYS_UPDATED', { journeys: this.journeys });
    eventBus.emit('JOURNEY_LOADED', { journey: this.activeJourney });
  }

  /**
   * Set the active journey by ID
   */
  setActiveJourney(id) {
    const journey = this.journeys.find(j => j.id === id);
    if (journey) {
      this.activeJourneyId = id;
      this.save();
      eventBus.emit('JOURNEY_LOADED', { journey });
    }
  }

  /**
   * Create a new blank journey
   */
  loadEmptyJourney() {
    const newJourney = {
      id: generateId('j'),
      title: 'New Adventure',
      status: 'planning',
      createdAt: Date.now(),
      lastModified: Date.now(),
      days: [],
      tickets: []
    };
    this.journeys.push(newJourney);
    this.activeJourneyId = newJourney.id;
    this.save();
    eventBus.emit('JOURNEY_LOADED', { journey: newJourney });
  }

  /**
   * Delete a journey by ID
   */
  deleteJourney(id) {
    this.journeys = this.journeys.filter(j => j.id !== id);
    if (this.activeJourneyId === id) {
      this.activeJourneyId = null;
      this.focusedDayId = null;
    }
    localStorage.setItem(this.storageKey, JSON.stringify({
      journeys: this.journeys,
      activeJourneyId: this.activeJourneyId
    }));
    eventBus.emit('JOURNEYS_UPDATED', { journeys: this.journeys });
  }

  /**
   * Add a new day to the active journey
   */
  addDay(date, city) {
    const journey = this.activeJourney;
    if (!journey) return;

    const newDay = {
      id: generateId('day'),
      date,
      city,
      picks: [],
      transit: []
    };
    
    journey.days.push(newDay);
    journey.days.sort((a, b) => new Date(a.date) - new Date(b.date));
    journey.lastModified = Date.now();
    this.save();
    eventBus.emit('JOURNEY_LOADED', { journey });
  }

  /**
   * Add a range of days for a city
   */
  addRange(startDate, endDate, city) {
    const journey = this.activeJourney;
    if (!journey) return;

    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      
      // Check if day already exists, update it or skip
      let day = journey.days.find(d => d.date === dateStr);
      if (day) {
        day.city = city;
      } else {
        journey.days.push({
          id: generateId('day'),
          date: dateStr,
          city,
          picks: [],
          transit: []
        });
      }
      // Use UTC date to avoid timezone shift during increment
      current.setUTCDate(current.getUTCDate() + 1);
    }

    journey.days.sort((a, b) => new Date(a.date) - new Date(b.date));
    journey.lastModified = Date.now();
    this.save();
    eventBus.emit('JOURNEY_LOADED', { journey });
  }

  /**
   * Add a pick (activity/attraction) to a specific day
   */
  addPick(dayId, pick) {
    const journey = this.activeJourney;
    if (!journey) return;

    const day = journey.days.find(d => d.id === dayId);
    if (day) {
      const sanitized = this.sanitizePick(pick);
      day.picks.push(sanitized);
      
      journey.lastModified = Date.now();
      this.save();
    }
  }

  /**
   * Set a hotel for a specific day
   */
  setHotel(dayId, hotel) {
    const journey = this.activeJourney;
    if (!journey) return;

    const day = journey.days.find(d => d.id === dayId);
    if (day) {
      day.hotelHub = {
        name: hotel.name,
        lat: hotel.lat,
        lng: hotel.lng,
        id: hotel.id
      };
      journey.lastModified = Date.now();
      this.save();
    }
  }

  /**
   * Auto-Calculate Transit Legs between city changes
   */
  refreshTransit() {
    const journey = this.activeJourney;
    if (!journey || !journey.days) return;

    for (let i = 0; i < journey.days.length; i++) {
      const current = journey.days[i];
      const prev = journey.days[i - 1];
      
      // Clear ONLY auto-generated transit legs
      current.transit = (current.transit || []).filter(t => !t.autoGenerated);

      if (prev && prev.city.name !== current.city.name) {
        // City changed! Add transit leg to the arrival day
        current.transit.push({
          id: generateId('tr'),
          mode: 'Transfer',
          from: prev.city.name,
          to: current.city.name,
          departureTime: '09:00',
          autoGenerated: true
        });
      }
    }
  }
  
  /**
   * Add a ticket/document to the active journey
   */
  addTicket(ticket) {
    const journey = this.activeJourney;
    if (!journey) return;

    if (!journey.tickets) journey.tickets = [];
    
    const newTicket = {
      id: generateId('t'),
      name: ticket.name || 'New Document',
      type: ticket.type || 'other',
      data: ticket.data || null,
      date: ticket.date || null
    };

    journey.tickets.push(newTicket);
    journey.lastModified = Date.now();
    this.save();
    eventBus.emit('JOURNEY_LOADED', { journey });
  }

  /**
   * Remove a specific day by ID
   */
  removeDay(dayId) {
    const journey = this.activeJourney;
    if (!journey) return;

    journey.days = journey.days.filter(d => d.id !== dayId);
    if (this.focusedDayId === dayId) {
      this.focusedDayId = journey.days.length > 0 ? journey.days[0].id : null;
    }
    journey.lastModified = Date.now();
    this.save();
    eventBus.emit('JOURNEY_LOADED', { journey });
  }

  /**
   * Reassign a day's city without losing its picks/hotel/transit
   */
  reassignDay(dayId, newCity) {
    const journey = this.activeJourney;
    if (!journey) return;

    const day = journey.days.find(d => d.id === dayId);
    if (day) {
      day.city = newCity;
      journey.lastModified = Date.now();
      this.save();
      eventBus.emit('JOURNEY_LOADED', { journey });
    }
  }

  /**
   * Reorder days manually
   */
  reorderDays({ oldIndex, newIndex }) {
    const journey = this.activeJourney;
    if (!journey || !journey.days) return;

    const [movedDay] = journey.days.splice(oldIndex, 1);
    journey.days.splice(newIndex, 0, movedDay);
    
    journey.lastModified = Date.now();
    this.save();
    eventBus.emit('JOURNEY_LOADED', { journey });
  }

  focusCity(lat, lng) {
    eventBus.emit('CITY_FOCUSED', { lat, lng });
  }

  addLogistics(dayId, entry) {
    const journey = this.activeJourney;
    if (!journey) return;
    const day = journey.days.find(d => d.id === dayId);
    if (!day) return;
    if (!day.logistics) day.logistics = [];
    day.logistics.push({
      id: 'log-' + Date.now(),
      ...entry
    });
    journey.lastModified = Date.now();
    this.save();
    eventBus.emit('JOURNEY_LOADED', { journey });
  }

  removeLogistics(dayId, logId) {
    const journey = this.activeJourney;
    if (!journey) return;
    const day = journey.days.find(d => d.id === dayId);
    if (!day || !day.logistics) return;
    day.logistics = day.logistics.filter(l => l.id !== logId);
    journey.lastModified = Date.now();
    this.save();
    eventBus.emit('JOURNEY_LOADED', { journey });
  }

  /**
   * Load demo data as a new journey
   */
  loadDemoJourney() {
    const dummy = {
      id: 'demo-' + Date.now(),
      title: 'The Great Alps Expedition',
      status: 'completed',
      createdAt: Date.now() - 86400000 * 365,
      lastModified: Date.now(),
      days: [
        {
          id: 'd1',
          date: '2025-09-10',
          city: { name: 'Chamonix', lat: 45.9237, lng: 6.8694 },
          hotelHub: { name: 'Hotel Mont Blanc', type: 'luxury' },
          transit: [{ mode: 'train', departureTime: '09:00', provider: 'SNCF' }],
          picks: [
            { id: 'p1', name: 'Aiguille du Midi', type: 'tour', vibe_reasoning: 'Highest point in the Alps for breathtaking views.' }
          ]
        },
        {
          id: 'd2',
          date: '2025-09-11',
          city: { name: 'Courmayeur', lat: 45.7871, lng: 6.9723 },
          hotelHub: { name: 'Grand Hotel Royal', type: 'boutique' },
          transit: [{ mode: 'bus', departureTime: '10:30', provider: 'Tunnel Link' }],
          picks: [
            { id: 'p2', name: 'Skyway Monte Bianco', type: 'tour', vibe_reasoning: 'Rotating cable car experience.' }
          ]
        }
      ]
    };
    this.journeys.push(dummy);
    this.activeJourneyId = dummy.id;
    this.save();
    eventBus.emit('JOURNEY_LOADED', { journey: dummy });
  }
}

export const journeyState = new JourneyState();
