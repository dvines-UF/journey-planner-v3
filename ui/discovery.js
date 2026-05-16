/**
 * ui/discovery.js
 * The Vibe Radar Discovery UI.
 * Handles the "Radar Compass" and Category selection.
 */

import { eventBus } from '../core/eventBus.js';
import { discoveryEngine } from '../services/discoveryEngine.js';
import { journeyState } from '../core/journeyState.js';

class DiscoveryUI {
  constructor() {
    this.container = null;
    this.activeCategory = 'dining';
    this.radarCoords = { distance: 0.5, intensity: 0.5 };
    this.isNomadMode = false;
    this.isDragging = false;
    this.isScanning = false;
    this.pendingScan = null;
    
    this.bindEvents();
  }

  bindEvents() {
    eventBus.on('VIEW_CHANGED', (payload) => {
      if (payload.view === 'map') {
        this.ensureContainer();
        this.container.classList.remove('translate-x-full');
      } else if (this.container) {
        this.container.classList.add('translate-x-full');
      }
    });
  }

  ensureContainer() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'discovery-radar-panel';
    this.container.className = 'fixed top-4 right-4 md:w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/50 p-6 z-40 transition-transform duration-500 transform translate-x-full';
    
    this.render();
    document.body.appendChild(this.container);
  }

  render() {
    this.container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-black text-slate-800 dark:text-white tracking-tight">Discovery Radar</h3>
          <div id="radar-status" class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ready</div>
        </div>

        <!-- Category Chips -->
        <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          ${['dining', 'historic', 'spooky', 'museums', 'nature'].map(cat => `
            <button class="category-chip px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              this.activeCategory === cat 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }" data-category="${cat}">
              ${cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          `).join('')}
        </div>

        <!-- The Radar Visual -->
        <div class="relative w-full aspect-square bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden cursor-crosshair" id="radar-area">
          <div class="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div class="w-1/3 h-1/3 border border-slate-400 dark:border-slate-500 rounded-full"></div>
            <div class="w-2/3 h-2/3 border border-slate-400 dark:border-slate-500 rounded-full absolute"></div>
          </div>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div class="w-px h-full bg-slate-300 dark:bg-slate-600"></div>
             <div class="h-px w-full bg-slate-300 dark:bg-slate-600 absolute"></div>
          </div>
          <div id="radar-pointer" class="absolute w-8 h-8 bg-blue-600 rounded-full shadow-xl border-4 border-white dark:border-slate-900 cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2" style="left: 50%; top: 50%;"></div>
          
          <!-- Axis Labels -->
          <div class="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-tighter text-slate-400">Intense</div>
          <div class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-tighter text-slate-400">Chill</div>
          <div class="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] font-black uppercase tracking-tighter text-slate-400">Local</div>
          <div class="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-[8px] font-black uppercase tracking-tighter text-slate-400">Trek</div>
        </div>

        <!-- Nomad Toggle -->
        <div class="flex items-center justify-between bg-slate-100/80 dark:bg-slate-800/80 p-3 rounded-2xl">
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white">Nomad Mode</span>
            <span class="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Avoid the crowds</span>
          </div>
          <button id="nomad-toggle" class="w-12 h-6 rounded-full transition-colors relative ${this.isNomadMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}">
            <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform transform ${this.isNomadMode ? 'translate-x-6' : ''}"></div>
          </button>
        </div>

        <p class="text-[10px] text-center text-slate-400 font-medium italic">Drag the pointer to discover hidden gems</p>
      </div>
    `;

    this.setupInteractions();
  }

  setupInteractions() {
    const area = this.container.querySelector('#radar-area');
    const pointer = this.container.querySelector('#radar-pointer');
    const chips = this.container.querySelectorAll('.category-chip');

    chips.forEach(chip => {
      chip.onclick = () => {
        this.activeCategory = chip.dataset.category;
        this.render();
        this.triggerDiscovery();
      };
    });

    const nomadBtn = this.container.querySelector('#nomad-toggle');
    nomadBtn.onclick = () => {
      this.isNomadMode = !this.isNomadMode;
      this.render();
      this.triggerDiscovery();
    };

    const updatePointer = (e) => {
      const rect = area.getBoundingClientRect();
      let x = (e.clientX - rect.left) / rect.width;
      let y = (e.clientY - rect.top) / rect.height;
      
      x = Math.max(0, Math.min(1, x));
      y = Math.max(0, Math.min(1, y));
      
      pointer.style.left = `${x * 100}%`;
      pointer.style.top = `${y * 100}%`;
      
      this.radarCoords = { distance: x, intensity: 1 - y };
    };

    area.onmousedown = (e) => {
      this.isDragging = true;
      updatePointer(e);
    };

    window.onmousemove = (e) => {
      if (this.isDragging) updatePointer(e);
    };

    window.onmouseup = () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.triggerDiscovery();
      }
    };
    
    // Touch support
    area.ontouchstart = (e) => {
      this.isDragging = true;
      updatePointer(e.touches[0]);
    };
    window.ontouchmove = (e) => {
      if (this.isDragging) updatePointer(e.touches[0]);
    };
    window.ontouchend = () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.triggerDiscovery();
      }
    };
  }

  async triggerDiscovery() {
    if (this.isScanning) {
      this.pendingScan = true;
      return;
    }

    const status = this.container.querySelector('#radar-status');
    status.textContent = 'Scanning...';
    status.classList.add('text-blue-500', 'animate-pulse');

    this.isScanning = true;
    this.pendingScan = false;

    try {
      const journey = journeyState.journey;
      if (!journey || journey.days.length === 0) return;

      const city = journey.days[0].city;
      const results = await discoveryEngine.runDiscovery(
        this.activeCategory, 
        this.radarCoords, 
        city.name, 
        { lat: city.lat, lng: city.lng },
        this.isNomadMode
      );

      status.textContent = 'Found ' + results.length;
      eventBus.emit('DISCOVERY_RESULTS_READY', { results });
    } finally {
      this.isScanning = false;
      status.classList.remove('text-blue-500', 'animate-pulse');
      
      if (this.pendingScan) {
        this.triggerDiscovery();
      }
    }
  }
}

export const discoveryUI = new DiscoveryUI();
