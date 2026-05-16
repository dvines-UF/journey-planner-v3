import { eventBus } from '../core/eventBus.js';
import { journeyState } from '../core/journeyState.js';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Singleton promise to ensure we only load the script once
let googleMapsPromise = null;

export function loadGoogleMapsScript() {
    if (googleMapsPromise) return googleMapsPromise;

    googleMapsPromise = new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            resolve(window.google.maps);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=marker,places&v=beta`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google.maps);
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });

    return googleMapsPromise;
}

/**
 * Journey Map Controller
 * Handles Google Maps initialization, marker plotting, and view synchronization.
 */
class JourneyMap {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.mapInstance = null;
    this.markers = [];
    this.ghostMarkers = [];
    this.AdvancedMarkerElement = null;

    eventBus.on('JOURNEY_LOADED', this.initMap.bind(this));
    eventBus.on('CITY_FOCUSED', this.panTo.bind(this));
    eventBus.on('VIEW_CHANGED', (payload) => this.handleViewChange(payload));
    eventBus.on('THEME_CHANGED', (payload) => this.updateMapStyle(payload.theme));
    eventBus.on('DISCOVERY_RESULTS_READY', (payload) => this.renderGhostPins(payload.results));
  }

  handleViewChange(payload) {
    if (payload.view === 'map' && this.mapInstance) {
      setTimeout(() => {
          window.google.maps.event.trigger(this.mapInstance, 'resize');
          if (this.markers.length > 0) {
              const bounds = new window.google.maps.LatLngBounds();
              this.markers.forEach(m => bounds.extend(m.position));
              this.mapInstance.fitBounds(bounds);
          }
      }, 100);
    }
  }

  updateMapStyle(theme = null) {
    if (!this.mapInstance) return;
    const activeTheme = theme || localStorage.getItem('journey_theme') || 'light';
    this.mapInstance.setOptions({
      styles: activeTheme === 'dark' ? this.getDarkStyles() : []
    });
  }

  getDarkStyles() {
    return [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
      },
      {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
      },
    ];
  }

  async initMap(payload) {
    const journey = payload.journey;
    
    if (!GOOGLE_MAPS_API_KEY) {
        this.renderFallback(journey);
        return;
    }

    if (this.mapInstance) {
      this.plotJourney(journey);
      this.updateMapStyle();
      return;
    }

    try {
      await loadGoogleMapsScript();

      const { Map, InfoWindow, places } = window.google.maps;
      this.AdvancedMarkerElement = window.google.maps.marker?.AdvancedMarkerElement;

      const activeTheme = localStorage.getItem('journey_theme') || 'light';
      
      const initialCenter = journey.days.length > 0 
        ? { lat: journey.days[0].city.lat, lng: journey.days[0].city.lng } 
        : { lat: 41.9028, lng: 12.4964 };

      this.mapInstance = new Map(this.container, {
        center: initialCenter,
        zoom: 11,
        disableDefaultUI: true, 
        zoomControl: true,
        clickableIcons: true,
        styles: activeTheme === 'dark' ? this.getDarkStyles() : []
      });

      this.infoWindow = new InfoWindow();
      this.placesService = new places.PlacesService(this.mapInstance);

      this.mapInstance.addListener('click', (e) => {
        if (e.placeId) {
          e.stop();
          this.handlePoiClick(e);
        }
      });

      this.renderSearchBar();
      this.plotJourney(journey);

      setTimeout(() => {
          window.google.maps.event.trigger(this.mapInstance, 'resize');
          if (this.markers.length > 0) {
              const bounds = new window.google.maps.LatLngBounds();
              this.markers.forEach(m => bounds.extend(m.position));
              this.mapInstance.fitBounds(bounds);
          }
      }, 300);

    } catch (err) {
      console.error('Google Maps Init Failed:', err);
      this.renderFallback(journey, 'Failed to load Google Maps.');
    }
  }

  plotJourney(journey) {
    if (!this.mapInstance) return;

    // Clear existing markers
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];

    const bounds = new window.google.maps.LatLngBounds();

    journey.days.forEach((day, index) => {
      if (!day.city.lat || !day.city.lng) return;

      const position = { lat: day.city.lat, lng: day.city.lng };
      
      const marker = new window.google.maps.Marker({
        position: position,
        map: this.mapInstance,
        title: `Day ${index + 1}: ${day.city.name}`,
        // Use a simple label for now, we can customize icon later
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontWeight: 'bold'
        }
      });

      this.markers.push(marker);
      bounds.extend(position);
    });

    if (this.markers.length > 0) {
      this.mapInstance.fitBounds(bounds);
      if (this.markers.length === 1) {
        this.mapInstance.setZoom(12);
      }
    }
  }

  renderSearchBar() {
    if (document.getElementById('map-search-bar')) return;

    const input = document.createElement('input');
    input.id = 'map-search-bar';
    input.type = 'text';
    input.placeholder = 'Search for attractions, hotels, restaurants...';
    input.className = 'absolute top-6 left-1/2 -translate-x-1/2 w-[85%] max-w-md z-[60] bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-2xl border-2 border-transparent focus:border-blue-500 outline-none text-sm font-bold dark:text-white transition-all';
    
    this.container.appendChild(input);

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      fields: ['geometry', 'name', 'types', 'formatted_address', 'place_id'],
      types: ['establishment', 'geocode']
    });

    autocomplete.bindTo('bounds', this.mapInstance);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) return;

      this.mapInstance.setCenter(place.geometry.location);
      this.mapInstance.setZoom(16);

      this.showPOIChoiceModal(place, {
        latLng: place.geometry.location,
        placeId: place.place_id
      });
      
      input.value = '';
      input.blur();
    });
  }

  panTo(payload) {
    if (!this.mapInstance || !payload.lat) return;
    this.mapInstance.panTo({ lat: payload.lat, lng: payload.lng });
    this.mapInstance.setZoom(14);
  }

  handlePoiClick(event) {
    this.placesService.getDetails({ 
      placeId: event.placeId, 
      fields: ['name', 'types', 'formatted_address', 'geometry', 'place_id'] 
    }, (place, status) => {
      if (status === 'OK' && place) {
        this.showPOIChoiceModal(place, event);
      }
    });
  }

  showPOIChoiceModal(place, event) {
    const focusedDayId = journeyState.focusedDayId;
    if (!focusedDayId) {
      alert("Please select a day in your timeline first!");
      return;
    }

    const content = document.createElement('div');
    content.className = 'p-2 min-w-[200px]';
    
    const h4 = document.createElement('h4');
    h4.className = 'font-black text-slate-900 text-sm mb-1';
    h4.textContent = place.name;
    
    const p = document.createElement('p');
    p.className = 'text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3';
    p.textContent = place.types?.[0]?.replace(/_/g, ' ') || 'Point of Interest';
    
    const btnRow = document.createElement('div');
    btnRow.className = 'flex gap-2';
    
    const btnActivity = document.createElement('button');
    btnActivity.className = 'flex-1 bg-blue-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-md';
    btnActivity.textContent = '📍 Activity';
    
    const btnHotel = document.createElement('button');
    btnHotel.className = 'flex-1 bg-amber-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-md';
    btnHotel.textContent = '🏨 Hotel';
    
    btnRow.appendChild(btnActivity);
    btnRow.appendChild(btnHotel);
    
    content.appendChild(h4);
    content.appendChild(p);
    content.appendChild(btnRow);

    this.infoWindow.setContent(content);
    this.infoWindow.setPosition(event.latLng);
    this.infoWindow.open(this.mapInstance);

    btnActivity.onclick = () => {
      journeyState.addPick(focusedDayId, {
        name: place.name,
        type: place.types?.[0] || 'attraction',
        notes: place.formatted_address
      });
      this.infoWindow.close();
      this.showSuccessFeedback(focusedDayId, 'ring-green-500/50');
    };

    btnHotel.onclick = () => {
      journeyState.setHotel(focusedDayId, {
        name: place.name,
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        id: place.place_id
      });
      this.infoWindow.close();
      this.showSuccessFeedback(focusedDayId, 'ring-amber-500/50');
    };
  }

  showSuccessFeedback(dayId, ringClass) {
    const targetCard = document.querySelector(`[data-id="${dayId}"]`);
    if (targetCard) {
      targetCard.classList.add('ring-4', ringClass);
      setTimeout(() => targetCard.classList.remove('ring-4', ringClass), 1000);
    }
  }

  renderFallback(journey, errorText = null) {
    this.container.innerHTML = '';

    const placeholder = document.createElement('div');
    placeholder.className = 'w-full h-full bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center shadow-inner transition-colors duration-500';
    
    const icon = document.createElement('div');
    icon.innerHTML = `<svg class="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>`;
    
    const text = document.createElement('h3');
    text.className = 'text-xl font-bold text-slate-700 dark:text-slate-300 tracking-tight';
    text.textContent = errorText ? 'Map API Error' : 'Map View Offline';

    const subtext = document.createElement('p');
    subtext.className = 'text-sm text-slate-500 dark:text-slate-500 mt-2 max-w-xs font-medium';
    if (errorText) {
        subtext.textContent = `Error: ${errorText}`;
    } else {
        subtext.textContent = 'This map view requires a Google Maps API Key. Your itinerary is still safe and editable.';
    }

    placeholder.appendChild(icon);
    placeholder.appendChild(text);
    placeholder.appendChild(subtext);
    this.container.appendChild(placeholder);
  }

  /**
   * Discovery Logic: Renders semi-transparent "Ghost Pins"
   */
  async renderGhostPins(results) {
    if (!this.mapInstance) return;
    this.clearGhostPins();

    if (!results || results.length === 0) return;

    results.forEach(place => {
      const marker = new window.google.maps.Marker({
        position: place.geometry.location,
        map: this.mapInstance,
        title: place.name,
        opacity: 0.7,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#3b82f6',
          fillOpacity: 0.4,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
        animation: window.google.maps.Animation.DROP
      });

      marker.addListener('click', () => {
        const content = document.createElement('div');
        content.className = 'p-3 max-w-[200px]';
        
        const h4 = document.createElement('h4');
        h4.className = 'font-black text-slate-800 text-sm mb-1';
        h4.textContent = place.name;
        
        const p = document.createElement('p');
        p.className = 'text-[10px] text-slate-500 mb-3';
        p.textContent = place.vibe_description;
        
        const btn = document.createElement('button');
        btn.className = 'w-full py-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors';
        btn.textContent = 'Add to Journey';
        btn.onclick = () => {
          this.crystallizePick(place);
          this.infoWindow.close();
        };
        
        content.appendChild(h4);
        content.appendChild(p);
        content.appendChild(btn);

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.mapInstance, marker);
      });

      this.ghostMarkers.push(marker);
    });

    // Pan to include results
    const bounds = new window.google.maps.LatLngBounds();
    this.ghostMarkers.forEach(m => bounds.extend(m.getPosition()));
    this.mapInstance.fitBounds(bounds, { padding: 100 });
  }

  clearGhostPins() {
    this.ghostMarkers.forEach(m => {
      window.google.maps.event.clearInstanceListeners(m);
      m.setMap(null);
    });
    this.ghostMarkers = [];
  }

  crystallizePick(place) {
    const journey = journeyState.journey;
    if (!journey || journey.days.length === 0) return;

    // Use the focused day, or fallback to the first day
    const targetDayId = journeyState.focusedDayId || journey.days[0].id;
    
    journeyState.addPick(targetDayId, {
      name: place.name,
      type: 'sight',
      notes: place.vibe_description
    });

    this.clearGhostPins();
    
    // Switch to Plan view to show the result
    eventBus.emit('NAVIGATE_TO', { view: 'plan' });
  }
}

export const journeyMap = new JourneyMap('map-instance');
