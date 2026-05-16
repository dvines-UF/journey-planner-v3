import { eventBus } from '../core/eventBus.js';
import { journeyState } from '../core/journeyState.js';

class DashboardView {
  constructor() {
    this.container = document.getElementById('dashboard-container');
    this.appContainer = document.getElementById('app-main-content');
    this.tripsList = document.getElementById('trips-list');
    this.btnNewTrip = document.getElementById('btn-dashboard-new');
    this.btnHome = document.getElementById('btn-home');

    if (!this.container) return;

    this.bindEvents();
    eventBus.on('JOURNEYS_UPDATED', this.render.bind(this));
    eventBus.on('JOURNEY_LOADED', (payload) => {
      if (payload.journey) {
        this.close();
      } else {
        this.open();
      }
    });
  }

  bindEvents() {
    if (this.btnNewTrip) {
      this.btnNewTrip.onclick = () => journeyState.loadEmptyJourney();
    }
    if (this.btnHome) {
      this.btnHome.onclick = () => this.open();
    }
  }

  open() {
    this.container.classList.remove('hidden');
    this.appContainer.classList.add('hidden');
    this.render({ journeys: journeyState.journeys });
  }

  close() {
    this.container.classList.add('hidden');
    this.appContainer.classList.remove('hidden');
  }

  render({ journeys }) {
    if (!this.tripsList) return;
    this.tripsList.innerHTML = '';

    if (!journeys || journeys.length === 0) {
      this.tripsList.innerHTML = `
        <div class="col-span-full py-20 text-center">
          <div class="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg class="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          </div>
          <h3 class="text-xl font-bold text-slate-800 dark:text-white">No journeys yet</h3>
          <p class="text-slate-500 dark:text-slate-400 mt-2">Start your first expedition by clicking the button above.</p>
        </div>
      `;
      return;
    }

    // Sort journeys: Planning first, then by date
    const sortedJourneys = [...journeys].sort((a, b) => {
      if (a.status === 'planning' && b.status !== 'planning') return -1;
      if (a.status !== 'planning' && b.status === 'planning') return 1;
      return b.lastModified - a.lastModified;
    });

    sortedJourneys.forEach(journey => {
      const card = document.createElement('div');
      card.className = 'group bg-white dark:bg-slate-800 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col cursor-pointer transform hover:-translate-y-1';
      
      const statusColors = {
        planning: 'bg-amber-100 text-amber-700',
        active: 'bg-green-100 text-green-700',
        completed: 'bg-blue-100 text-blue-700',
        archived: 'bg-slate-100 text-slate-700'
      };

      const heroGradient = journey.status === 'completed' ? 'from-slate-700 to-slate-900' : 'from-blue-500 to-blue-700';

      card.innerHTML = `
        <div class="h-32 bg-gradient-to-br ${heroGradient} relative p-6 flex flex-col justify-end">
           <div class="absolute top-4 right-4 flex gap-2">
              <button class="btn-delete p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors" title="Delete Journey">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
           </div>
           <span class="absolute top-4 left-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusColors[journey.status]} backdrop-blur-sm bg-white/90 shadow-sm">${journey.status}</span>
           <h3 class="text-white font-bold text-xl leading-tight line-clamp-1">${journey.title}</h3>
        </div>
        <div class="p-6 flex-1 flex flex-col">
           <div class="flex items-center gap-4 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <div class="flex items-center gap-1.5">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                 ${journey.days.length} Days
              </div>
              <div class="flex items-center gap-1.5">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 ${new Date(journey.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
           </div>
           <div class="mt-auto flex justify-between items-center">
              <span class="text-xs text-slate-400 font-medium italic">Created ${new Date(journey.createdAt).toLocaleDateString()}</span>
              <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
           </div>
        </div>
      `;

      card.onclick = (e) => {
        if (e.target.closest('.btn-delete')) {
          e.stopPropagation();
          if (confirm(`Delete "${journey.title}" forever?`)) {
            journeyState.deleteJourney(journey.id);
          }
          return;
        }
        journeyState.setActiveJourney(journey.id);
      };

      this.tripsList.appendChild(card);
    });
  }
}

export const dashboardView = new DashboardView();
