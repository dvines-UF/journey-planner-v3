import { eventBus } from '../core/eventBus.js';
import { journeyState } from '../core/journeyState.js';
import { TimelineCard } from './timeline/timelineCard.js';
import { TimelineSummary } from './timeline/timelineSummary.js';
import { safeRender } from '../core/utils.js';

/**
 * Main Timeline Orchestrator
 * Enforces the 400-line hygiene rule by delegating rendering to sub-modules.
 */
class Timeline {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.draggedIndex = null;
    this.bindEvents();
  }

  bindEvents() {
    eventBus.on('JOURNEY_LOADED', this.render.bind(this));
    eventBus.on('TRANSIT_CALCULATED', this.renderTransitTimes.bind(this));
  }

  /**
   * Main render loop for the timeline
   * @param {Object} payload - Contains the journey data
   */
  render(payload) {
    const journey = payload.journey;
    this.container.innerHTML = ''; 

    if (!journey || !journey.days || journey.days.length === 0) {
      this.renderEmptyState();
      return;
    }

    const fragment = document.createDocumentFragment();

    // 1. Render Summary Header
    fragment.appendChild(TimelineSummary.render(journey));

    // 2. Setup Scroll-Spy
    const observer = this.createScrollObserver();

    // 3. Render Day Cards
    journey.days.forEach((day, index) => {
      const card = safeRender(() => TimelineCard.render(day, index, {
        onDragStart: this.handleDragStart.bind(this),
        onDragEnd: this.handleDragEnd.bind(this),
        onDragOver: this.handleDragOver.bind(this),
        onDragLeave: this.handleDragLeave.bind(this),
        onDrop: this.handleDrop.bind(this)
      }), day);
      
      if (card) {
        observer.observe(card);
        fragment.appendChild(card);
      }
    });

    this.container.appendChild(fragment);
  }

  renderEmptyState() {
    this.container.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 animate-fade-in mt-20">
        <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5 border-4 border-white shadow-lg">
          <svg class="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        </div>
        <h2 class="text-2xl font-black text-slate-800 mb-2 tracking-tight">Empty Journey</h2>
        <p class="text-sm font-medium text-slate-500 max-w-[250px]">Switch to the Calendar to start planning your adventure.</p>
        <button id="btn-empty-calendar" class="mt-8 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all">Open Calendar</button>
      </div>
    `;
    const btn = document.getElementById('btn-empty-calendar');
    if (btn) {
      btn.onclick = () => {
        // Emit a view change or find the navigation buttons
        const navBtns = document.querySelectorAll('nav button, #desktop-view-toggle button');
        const calBtn = Array.from(navBtns).find(b => b.textContent.trim().toLowerCase() === 'calendar');
        if (calBtn) {
          calBtn.click();
        } else {
          // Fallback: manually trigger the containers
          document.getElementById('calendar-container')?.classList.remove('hidden');
          document.getElementById('map-container')?.classList.add('hidden');
          document.getElementById('left-canvas-area')?.classList.remove('hidden');
        }
      };
    }
  }

  createScrollObserver() {
    let currentFocusedCardId = null;
    return new IntersectionObserver((entries) => {
      if (window.innerWidth < 768) return;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cardId = entry.target.dataset.id;
          if (currentFocusedCardId !== cardId) {
            currentFocusedCardId = cardId;
            journeyState.setFocusedDay(cardId);
            
            const lat = parseFloat(entry.target.dataset.lat);
            const lng = parseFloat(entry.target.dataset.lng);
            eventBus.emit('CITY_FOCUSED', { lat, lng });
            
            document.querySelectorAll('.day-card').forEach(c => c.classList.remove('ring-4', 'ring-blue-500/20', 'border-blue-500/50'));
            entry.target.classList.add('ring-4', 'ring-blue-500/20', 'border-blue-500/50', 'z-10');
          }
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
  }

  // --- DRAG AND DROP HANDLERS ---
  handleDragStart(e, index, el) {
    this.draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setTimeout(() => el.classList.add('opacity-40', 'scale-95'), 0);
  }

  handleDragEnd(el) {
    el.classList.remove('opacity-40', 'scale-95');
    this.draggedIndex = null;
  }

  handleDragOver(e, index, el) {
    e.preventDefault();
    if (this.draggedIndex !== null && index !== this.draggedIndex) {
      el.classList.add('border-blue-500', 'border-t-4');
    }
  }

  handleDragLeave(el) {
    el.classList.remove('border-blue-500', 'border-t-4');
  }

  handleDrop(e, index, el) {
    e.preventDefault();
    el.classList.remove('border-blue-500', 'border-t-4');
    if (this.draggedIndex !== null && this.draggedIndex !== index) {
      eventBus.emit('DAYS_REORDERED', { oldIndex: this.draggedIndex, newIndex: index });
    }
  }

  renderTransitTimes(transitData) {
    const dayCards = this.container.querySelectorAll('.day-card');
    transitData.forEach((data, index) => {
      const card = dayCards[index];
      if (card) {
        card.querySelector('.transit-connector')?.remove();
        const connector = document.createElement('div');
        connector.className = 'transit-connector absolute -bottom-5 left-1/2 -translate-x-1/2 z-20';
        connector.innerHTML = `
          <div class="bg-slate-800 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1.5">
            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            ${data.duration}
          </div>
        `;
        card.appendChild(connector);
      }
    });
  }
}

export const timeline = new Timeline('timeline-content');
