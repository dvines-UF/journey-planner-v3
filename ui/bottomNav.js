import { eventBus } from '../core/eventBus.js';

/**
 * Bottom Navigation Trigger
 * Responsibilities: UI updates for buttons and firing navigation events.
 * Structural Change: Logic delegated to ViewOrchestrator.
 */
class BottomNav {
  constructor() {
    this.nav = document.querySelector('nav');
    this.desktopToggle = document.getElementById('desktop-view-toggle');
    if (!this.nav) return;

    this.mobileButtons = Array.from(this.nav.querySelectorAll('button'));
    this.desktopButtons = this.desktopToggle ? Array.from(this.desktopToggle.querySelectorAll('button')) : [];
    
    this.bindEvents();
    eventBus.on('VIEW_CHANGED', (payload) => this.updateActiveState(payload.view));
  }

  bindEvents() {
    [...this.mobileButtons, ...this.desktopButtons].forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.textContent.trim().toLowerCase();
        eventBus.emit('NAVIGATE_TO', { view: tab });
      });
    });
  }

  updateActiveState(tabName) {
    // Mobile Nav UI
    this.mobileButtons.forEach(btn => {
      const isMatch = btn.textContent.trim().toLowerCase() === tabName;
      if (isMatch) {
        btn.classList.remove('text-slate-500', 'dark:text-slate-400');
        btn.classList.add('text-blue-600');
      } else {
        btn.classList.remove('text-blue-600');
        btn.classList.add('text-slate-500', 'dark:text-slate-400');
      }
    });

    // Desktop Toggle UI
    this.desktopButtons.forEach(btn => {
      const isMatch = btn.textContent.trim().toLowerCase() === tabName;
      if (isMatch) {
        btn.className = 'px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm';
      } else {
        btn.className = 'px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white';
      }
    });
  }
}

export const bottomNav = new BottomNav();
