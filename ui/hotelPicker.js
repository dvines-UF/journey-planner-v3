import { eventBus } from '../core/eventBus.js';
import { discoveryEngine } from '../services/discoveryEngine.js';
import { journeyState } from '../core/journeyState.js';

class HotelPicker {
  constructor() {
    this.overlay = null;
    this.activeDayId = null;
    this.activeCity = null;
    this.activeCoords = null;
    
    this.init();
  }

  init() {
    eventBus.on('OPEN_HOTEL_PICKER', ({ dayId, city, coords }) => {
      this.activeDayId = dayId;
      this.activeCity = city;
      this.activeCoords = coords;
      this.show();
    });
  }

  show() {
    this.ensureOverlay();
    this.overlay.classList.remove('hidden');
    this.overlay.classList.add('flex');
    this.renderLoading();
    this.fetchHotels();
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.add('hidden');
      this.overlay.classList.remove('flex');
    }
  }

  ensureOverlay() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] hidden items-center justify-center p-4';
    this.overlay.onclick = (e) => { if (e.target === this.overlay) this.hide(); };
    
    document.body.appendChild(this.overlay);
  }

  renderLoading() {
    this.overlay.innerHTML = `
      <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8 flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="font-bold text-slate-900 dark:text-white">Finding Hotel Hubs in ${this.activeCity}...</p>
      </div>
    `;
  }

  async fetchHotels() {
    const hotels = await discoveryEngine.findHotels(this.activeCity, this.activeCoords);
    this.renderResults(hotels);
  }

  renderResults(hotels) {
    this.overlay.innerHTML = '';
    
    const panel = document.createElement('div');
    panel.className = 'bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[80vh]';
    
    const header = document.createElement('div');
    header.className = 'p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center';
    
    const titleGroup = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.className = 'text-xl font-black text-slate-900 dark:text-white tracking-tight';
    h3.textContent = 'Select Hotel Hub';
    
    const p = document.createElement('p');
    p.className = 'text-[10px] font-bold text-slate-400 uppercase tracking-widest';
    p.textContent = this.activeCity;
    
    titleGroup.appendChild(h3);
    titleGroup.appendChild(p);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-slate-400 hover:text-slate-600 dark:hover:text-white';
    closeBtn.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    closeBtn.onclick = () => this.hide();
    
    header.appendChild(titleGroup);
    header.appendChild(closeBtn);
    panel.appendChild(header);
    
    const list = document.createElement('div');
    list.className = 'flex-1 overflow-y-auto p-4 space-y-3';
    
    if (hotels.length > 0) {
      hotels.forEach(h => {
        const item = document.createElement('div');
        item.className = 'p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all group';
        
        if (h.photo) {
          const img = document.createElement('img');
          img.className = 'w-16 h-16 rounded-xl object-cover shadow-md';
          img.src = h.photo;
          item.appendChild(img);
        } else {
          const fallback = document.createElement('div');
          fallback.className = 'w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center';
          fallback.innerHTML = '<svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
          item.appendChild(fallback);
        }
        
        const info = document.createElement('div');
        info.className = 'flex-1';
        
        const name = document.createElement('h4');
        name.className = 'font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors';
        name.textContent = h.name;
        
        const meta = document.createElement('div');
        meta.className = 'flex items-center gap-2 mt-1';
        const rating = document.createElement('span');
        rating.className = 'text-xs font-black text-amber-500';
        rating.textContent = `★ ${h.rating || 'N/A'}`;
        
        meta.appendChild(rating);
        info.appendChild(name);
        info.appendChild(meta);
        item.appendChild(info);
        
        item.onclick = () => {
          journeyState.setHotel(this.activeDayId, h);
          this.hide();
        };
        
        list.appendChild(item);
      });
    } else {
      const empty = document.createElement('p');
      empty.className = 'text-center p-8 text-slate-400';
      empty.textContent = 'No hotels found. Try another location.';
      list.appendChild(empty);
    }
    
    panel.appendChild(list);
    this.overlay.appendChild(panel);
  }
}

export const hotelPicker = new HotelPicker();
