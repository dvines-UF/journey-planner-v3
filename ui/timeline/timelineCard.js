import { eventBus } from '../../core/eventBus.js';
import { journeyState } from '../../core/journeyState.js';
import { formatDatePretty } from '../../core/utils.js';

/**
 * Handles rendering of an individual Day Card in the Timeline
 */
export class TimelineCard {
  /**
   * @param {Object} day - The day data from the journey
   * @param {number} index - The index of the day
   * @param {Object} handlers - Drag and drop handlers
   */
  static render(day, index, handlers) {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card mb-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md cursor-grab active:cursor-grabbing flex flex-col overflow-hidden duration-300';
    dayCard.draggable = true;
    dayCard.dataset.index = index;
    dayCard.dataset.id = day.id;
    dayCard.dataset.lat = day.city?.lat || 0;
    dayCard.dataset.lng = day.city?.lng || 0;

    // Attach Drag Events
    dayCard.addEventListener('dragstart', (e) => handlers.onDragStart(e, index, dayCard));
    dayCard.addEventListener('dragend', () => handlers.onDragEnd(dayCard));
    dayCard.addEventListener('dragover', (e) => handlers.onDragOver(e, index, dayCard));
    dayCard.addEventListener('dragleave', () => handlers.onDragLeave(dayCard));
    dayCard.addEventListener('drop', (e) => handlers.onDrop(e, index, dayCard));

    // Hero Image
    const headerImg = this.createHeader(day);
    dayCard.appendChild(headerImg);

    // Content Body
    const contentArea = this.createContent(day);
    dayCard.appendChild(contentArea);

    return dayCard;
  }

  static createHeader(day) {
    const headerImg = document.createElement('div');
    headerImg.className = 'w-full h-28 bg-gradient-to-br from-slate-800 to-slate-900 relative bg-cover bg-center flex-shrink-0 transition-all duration-700';
    
    this.fetchCityPhoto(day.city.name, headerImg);

    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent';
    headerImg.appendChild(overlay);

    const dragIcon = document.createElement('div');
    dragIcon.className = 'absolute top-3 right-3 text-white/60 hover:text-white cursor-grab drop-shadow-md';
    dragIcon.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>';
    headerImg.appendChild(dragIcon);

    const bottomArea = document.createElement('div');
    bottomArea.className = 'absolute bottom-4 left-5 right-5 flex justify-between items-end';
    
    const info = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.className = 'text-xl font-black text-white tracking-tight drop-shadow-md';
    h3.textContent = day.city?.name || 'Unknown City';
    
    const p = document.createElement('p');
    p.className = 'text-[10px] font-bold text-blue-200 drop-shadow-md uppercase tracking-wider';
    p.textContent = day.date ? formatDatePretty(day.date) : 'No Date';
    
    info.appendChild(h3);
    info.appendChild(p);
    bottomArea.appendChild(info);
    headerImg.appendChild(bottomArea);

    const focusBtn = document.createElement('button');
    focusBtn.className = 'text-xs bg-white/20 backdrop-blur-md text-white border border-white/30 px-4 py-2 rounded-full font-bold hover:bg-white/40 transition-colors shadow-lg';
    focusBtn.textContent = 'View Map';
    focusBtn.onclick = (e) => {
      e.stopPropagation();
      if (day.city) {
        journeyState.focusCity(day.city.lat, day.city.lng);
      }
      if (document.getElementById('btn-view-map')) document.getElementById('btn-view-map').click();
    };
    
    headerImg.querySelector('.flex.justify-between').appendChild(focusBtn);
    return headerImg;
  }

  static createContent(day) {
    const contentArea = document.createElement('div');
    contentArea.className = 'p-4 flex-1 space-y-3';

    // 1. Hotel Hub (The Anchor)
    const hotelWrapper = document.createElement('div');
    if (day.hotelHub) {
      hotelWrapper.className = 'bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm';
      
      const icon = document.createElement('div');
      icon.className = 'w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20';
      icon.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
      
      const textWrap = document.createElement('div');
      const label = document.createElement('p');
      label.className = 'text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5';
      label.textContent = 'Hotel Hub';
      
      const h4 = document.createElement('h4');
      h4.className = 'font-bold text-slate-900 dark:text-white leading-tight';
      h4.textContent = day.hotelHub.name;
      
      textWrap.appendChild(label);
      textWrap.appendChild(h4);
      
      const editBtn = document.createElement('button');
      editBtn.className = 'ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-white';
      editBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
      
      hotelWrapper.appendChild(icon);
      hotelWrapper.appendChild(textWrap);
      hotelWrapper.appendChild(editBtn);
    } else {
      hotelWrapper.className = 'border-2 border-dashed border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex items-center gap-3 group/hotel cursor-pointer hover:border-blue-300 dark:hover:border-blue-900 transition-all';
      hotelWrapper.innerHTML = `
        <div class="w-8 h-8 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-lg flex items-center justify-center group-hover/hotel:bg-blue-50 dark:group-hover/hotel:bg-blue-950 group-hover/hotel:text-blue-500 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </div>
        <span class="text-xs font-bold text-slate-400 group-hover/hotel:text-blue-600 transition-colors">Add Hotel Hub</span>
      `;
      hotelWrapper.onclick = (e) => {
        e.stopPropagation();
        eventBus.emit('OPEN_HOTEL_PICKER', { 
          dayId: day.id, 
          city: day.city?.name || 'Unknown', 
          coords: { lat: day.city?.lat || 0, lng: day.city?.lng || 0 } 
        });
      };
    }
    contentArea.appendChild(hotelWrapper);
    
    // Logistics (Flights/Trains)
    const logisticsWrap = document.createElement('div');
    logisticsWrap.className = 'space-y-2';
    
    if (day.logistics && day.logistics.length > 0) {
      day.logistics.forEach(log => {
        const logEl = document.createElement('div');
        logEl.className = 'bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group/log transition-all hover:bg-slate-100 dark:hover:bg-slate-800';
        
        const typeIcon = log.type === 'flight' ? '✈️' : (log.type === 'train' ? '🚆' : '🚗');
        
        logEl.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="text-lg">${typeIcon}</div>
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${log.type}</span>
              <span class="text-xs font-bold text-slate-900 dark:text-white">${log.details || 'Travel Details'}</span>
            </div>
          </div>
          <button class="text-slate-300 hover:text-red-500 opacity-0 group-hover/log:opacity-100 transition-all p-1" title="Remove">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        `;
        
        const deleteBtn = logEl.querySelector('button');
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          journeyState.removeLogistics(day.id, log.id);
        };
        
        logisticsWrap.appendChild(logEl);
      });
    }

    const addLogSlot = document.createElement('div');
    addLogSlot.className = 'border border-dashed border-slate-200 dark:border-slate-800 p-2.5 rounded-xl flex items-center gap-3 group/addlog cursor-pointer hover:border-blue-300 dark:hover:border-blue-900 transition-all';
    addLogSlot.innerHTML = `
      <div class="w-7 h-7 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-lg flex items-center justify-center group-hover/addlog:bg-blue-50 dark:group-hover/addlog:bg-blue-950 group-hover/addlog:text-blue-500 transition-colors shrink-0">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
      </div>
      <span class="text-[10px] font-bold text-slate-400 group-hover/addlog:text-blue-600 transition-colors">Add Flight / Train</span>
    `;
    addLogSlot.onclick = (e) => {
      e.stopPropagation();
      const details = prompt("Enter travel details (e.g., Flight BA202 to London):");
      if (details) {
        const type = details.toLowerCase().includes('flight') ? 'flight' : (details.toLowerCase().includes('train') ? 'train' : 'car');
        journeyState.addLogistics(day.id, { type, details });
      }
    };
    logisticsWrap.appendChild(addLogSlot);
    contentArea.appendChild(logisticsWrap);

    // 2. Transit Connection (If applicable)
    if (day.transit && day.transit.length > 0) {
      const transitList = document.createElement('div');
      transitList.className = 'space-y-2';
      day.transit.forEach(leg => {
        const transitEl = document.createElement('div');
        transitEl.className = 'bg-slate-50 dark:bg-slate-800/40 border-l-4 border-blue-500 p-3 rounded-r-2xl flex items-center justify-between group/transit transition-all hover:bg-slate-100 dark:hover:bg-slate-800';
        transitEl.innerHTML = `
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">${leg.mode}</span>
              <span class="text-[10px] font-bold text-slate-400">•</span>
              <span class="text-[10px] font-bold text-slate-500">${leg.departureTime}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-900 dark:text-white">${leg.from}</span>
              <svg class="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              <span class="text-xs font-bold text-slate-900 dark:text-white">${leg.to}</span>
            </div>
          </div>
          <div class="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover/transit:opacity-100 transition-opacity">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        `;
        transitList.appendChild(transitEl);
      });
      contentArea.appendChild(transitList);
    }

    // 3. Activity Flex Boxes (The Spoke)
    const picksWrapper = document.createElement('div');
    picksWrapper.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2';
    
    if (day.picks && day.picks.length > 0) {
      day.picks.forEach(pick => {
        const pickEl = document.createElement('div');
        pickEl.className = 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl shadow-sm flex items-center gap-3 hover:border-blue-200 dark:hover:border-blue-900 transition-all group/pick';
        const icon = document.createElement('div');
        icon.className = 'w-7 h-7 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg flex items-center justify-center group-hover/pick:bg-indigo-600 group-hover/pick:text-white transition-all shrink-0';
        icon.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>';
        
        const textWrap = document.createElement('div');
        textWrap.className = 'flex-1 overflow-hidden';
        
        const h5 = document.createElement('h5');
        h5.className = 'font-bold text-slate-900 dark:text-white text-[11px] truncate leading-tight';
        h5.textContent = pick.name;
        
        textWrap.appendChild(h5);
        pickEl.appendChild(icon);
        pickEl.appendChild(textWrap);
        picksWrapper.appendChild(pickEl);
      });
    }

    // Always show the "Add Activity" ghost slot at the end
    const addPickSlot = document.createElement('div');
    addPickSlot.className = 'border-2 border-dashed border-slate-50 dark:border-slate-800/50 p-2.5 rounded-xl flex items-center gap-3 group/add cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-900 transition-all';
    addPickSlot.innerHTML = `
      <div class="w-7 h-7 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-lg flex items-center justify-center group-hover/add:bg-indigo-50 dark:group-hover/add:bg-indigo-950 group-hover/add:text-indigo-500 transition-colors shrink-0">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
      </div>
      <span class="text-[11px] font-bold text-slate-400 group-hover/add:text-indigo-600 transition-colors">Add Activity</span>
    `;
    addPickSlot.onclick = (e) => {
      e.stopPropagation();
      alert(`Explore ${day.city.name} on the map!`);
    };
    picksWrapper.appendChild(addPickSlot);

    contentArea.appendChild(picksWrapper);

    return contentArea;
  }

  static fetchCityPhoto(cityName, imgElement) {
    const checkMaps = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        clearInterval(checkMaps);
        const dummy = document.createElement('div');
        const service = new window.google.maps.places.PlacesService(dummy);
        service.textSearch({ query: cityName + ' travel' }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const placeWithPhoto = results.find(r => r.photos && r.photos.length > 0);
            if (placeWithPhoto) {
              const url = placeWithPhoto.photos[0].getUrl({ maxWidth: 800, maxHeight: 400 });
              imgElement.style.backgroundImage = `url('${url}')`;
            }
          }
          // Premium Fallback Gradient
          imgElement.classList.add('bg-gradient-to-br', 'from-blue-900', 'via-indigo-950', 'to-slate-950');
        });
      }
    }, 500);
    setTimeout(() => clearInterval(checkMaps), 10000);
  }
}
