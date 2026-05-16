import { eventBus } from '../core/eventBus.js';
import { loadGoogleMapsScript } from './map.js';
import { journeyState } from '../core/journeyState.js';
import { formatDatePretty, parseDate } from '../core/utils.js';

/**
 * Calendar View Manager
 * Handles itinerary overview and date-based day addition.
 */
class CalendarView {
  constructor() {
    this.container = document.getElementById('calendar-container');
    if (!this.container) return;

    this.currentViewDate = new Date(); // Defaults to today
    this.viewMode = 'month'; // 'month' or 'week'
    
    // Range Selection State
    this.selectionStart = null;
    this.selectionEnd = null;
    
    this.bindEvents();
    eventBus.on('JOURNEY_LOADED', (payload) => {
      // When a journey loads, set view date to its first day
      if (payload.journey && payload.journey.days.length > 0) {
        this.currentViewDate = new Date(payload.journey.days[0].date);
      }
      this.render();
    });
  }

  bindEvents() {
    // Listens for view changes if we ever need to re-render
    eventBus.on('VIEW_CHANGED', (payload) => {
      if (payload.view === 'calendar') this.render();
    });
  }

  /**
   * Main render entry point
   */
  render() {
    this.container.innerHTML = '';
    const journey = journeyState.journey;

    // 1. Render Navigation Header
    this.renderHeader();

    // 2. Render Grid
    this.renderGrid(journey);
  }

  renderHeader() {
    const monthName = formatDatePretty(this.currentViewDate, { month: 'long', year: 'numeric' });
    
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-8';
    header.innerHTML = `
      <div>
        <h2 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight">${monthName}</h2>
        <p class="text-slate-400 font-medium text-sm">Pick a date to start planning</p>
      </div>
      <div class="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <button id="cal-prev" class="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
          <svg class="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <button id="cal-today" class="px-4 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">Today</button>
        <button id="cal-next" class="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
          <svg class="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    `;

    header.querySelector('#cal-prev').onclick = () => {
      this.currentViewDate.setMonth(this.currentViewDate.getMonth() - 1);
      this.render();
    };
    header.querySelector('#cal-next').onclick = () => {
      this.currentViewDate.setMonth(this.currentViewDate.getMonth() + 1);
      this.render();
    };
    header.querySelector('#cal-today').onclick = () => {
      this.currentViewDate = new Date();
      this.render();
    };

    this.container.appendChild(header);
  }

  renderGrid(journey) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pb-24';

    // Day of week headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(dow => {
      const dowEl = document.createElement('div');
      dowEl.className = 'hidden md:block text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2';
      dowEl.textContent = dow;
      grid.appendChild(dowEl);
    });

    // Calculate Grid Start (First Sunday of the month view)
    const startDate = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth(), 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Render 42 days (6 weeks) to maintain a consistent grid height
    let tempDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      const dateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
      const isCurrentMonth = tempDate.getMonth() === this.currentViewDate.getMonth();
      const isPlanned = journey?.days.find(d => d.date === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      const isSelected = this.selectionStart && this.selectionEnd && 
                         dateStr >= this.selectionStart && dateStr <= this.selectionEnd;
      const isStart = dateStr === this.selectionStart;

      const cell = document.createElement('div');
      cell.dataset.date = dateStr;
      cell.className = `min-h-[110px] border rounded-2xl p-4 cursor-pointer transition-all flex flex-col relative group ${
        isPlanned 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' 
          : (isSelected || isStart)
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 shadow-inner'
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
      } ${!isCurrentMonth ? 'opacity-30 grayscale' : ''}`;

      cell.innerHTML = `
        <span class="text-sm font-black ${isToday ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500'}">${tempDate.getDate()}</span>
      `;

      if (isPlanned) {
        const badge = document.createElement('div');
        badge.className = 'mt-auto bg-blue-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md line-clamp-2';
        badge.textContent = isPlanned.city.name;
        cell.appendChild(badge);
        
        cell.onclick = () => this.scrollToDay(dateStr);
      } else {
        const plus = document.createElement('div');
        plus.className = 'mt-auto self-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 dark:text-slate-600';
        plus.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>';
        cell.appendChild(plus);
        
        cell.onclick = () => this.handleDateClick(dateStr);
      }

      grid.appendChild(cell);
      tempDate.setDate(tempDate.getDate() + 1);
    }

    this.container.appendChild(grid);
  }

  handleDateClick(dateStr) {
    if (!this.selectionStart || (this.selectionStart && this.selectionEnd)) {
      // First click: Start range
      this.selectionStart = dateStr;
      this.selectionEnd = null;
      this.render();
    } else {
      // Second click: Finalize range
      if (dateStr < this.selectionStart) {
        // User clicked earlier date, reset start
        this.selectionStart = dateStr;
        this.render();
      } else {
        this.selectionEnd = dateStr;
        this.render();
        
        // Open modal for the whole range
        const startPretty = formatDatePretty(this.selectionStart, { month: 'short', day: 'numeric' });
        const endPretty = formatDatePretty(this.selectionEnd, { month: 'short', day: 'numeric' });
        const displayLabel = this.selectionStart === this.selectionEnd ? startPretty : `${startPretty} - ${endPretty}`;
        
        this.openAddDayModal(this.selectionStart, this.selectionEnd, displayLabel);
      }
    }
  }

  scrollToDay(dateStr) {
    const target = document.querySelector(`[data-date="${dateStr}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('ring-4', 'ring-blue-500/30');
      setTimeout(() => target.classList.remove('ring-4', 'ring-blue-500/30'), 2000);
      
      // Auto switch back to Plan on mobile
      if (window.innerWidth < 768) {
        document.querySelector('nav button:nth-child(1)')?.click();
      }
    }
  }

  async openAddDayModal(startDate, endDate, displayLabel) {
    const journey = journeyState.journey;
    if (!journey) return;

    // Build Modal UI
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in';
    overlay.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all scale-95 animate-scale-up border border-white/20">
        <h3 class="text-2xl font-black text-slate-800 dark:text-white mb-2">${displayLabel}</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Where are we heading for this trip segment?</p>
        <input type="text" id="city-search" placeholder="Search for a city..." class="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-blue-500 outline-none text-lg font-bold dark:text-white transition-all">
        <div class="mt-8 flex justify-end gap-3">
          <button id="modal-cancel" class="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    const input = overlay.querySelector('#city-search');
    
    const closeModal = () => {
      this.selectionStart = null;
      this.selectionEnd = null;
      this.render();
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
    };

    overlay.querySelector('#modal-cancel').onclick = closeModal;
    setTimeout(() => input.focus(), 100);

    try {
      await loadGoogleMapsScript();
      
      // NOMAD OPTIMIZATION: Prioritize search based on the previous city in the timeline
      const options = {
        fields: ['geometry', 'name'],
        types: ['locality', 'airport'] // Support both cities and airport codes
      };

      const prevDay = journey.days
        .filter(d => d.date < startDate)
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      if (prevDay && prevDay.city) {
        options.locationBias = { 
          radius: 500000, // 500km radius bias
          center: { lat: prevDay.city.lat, lng: prevDay.city.lng } 
        };
      }

      const autocomplete = new window.google.maps.places.Autocomplete(input, options);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          journeyState.addRange(startDate, endDate, {
            name: place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
          closeModal();
          
          // Switch to Plan view to show the result
          eventBus.emit('NAVIGATE_TO', { view: 'plan' });
        }
      });
    } catch (e) {
      console.error("Calendar Places Error", e);
    }
  }
}

export const calendarView = new CalendarView();
