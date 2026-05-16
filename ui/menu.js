import { eventBus } from '../core/eventBus.js';
import { journeyState } from '../core/journeyState.js';
import { dashboardView } from './dashboard.js';

/**
 * Menu Orchestrator
 * Handles the minimalist header menu and dropdown actions.
 */
class MenuController {
  constructor() {
    this.trigger = document.getElementById('btn-menu-trigger');
    this.menu = document.getElementById('dropdown-menu');
    this.btnMyJourneys = document.getElementById('menu-my-journeys');
    this.btnPublish = document.getElementById('menu-publish');
    this.btnDemo = document.getElementById('btn-load-demo');

    if (!this.trigger || !this.menu) return;

    this.bindEvents();
  }

  bindEvents() {
    // Toggle Menu
    this.trigger.onclick = (e) => {
      e.stopPropagation();
      this.toggle();
    };

    // Close menu when clicking outside
    document.addEventListener('click', () => this.close());
    this.menu.onclick = (e) => e.stopPropagation();

    // Menu Actions
    if (this.btnMyJourneys) {
      this.btnMyJourneys.onclick = () => {
        dashboardView.open();
        this.close();
      };
    }

    if (this.btnPublish) {
      this.btnPublish.onclick = () => {
        alert('Publishing System: Select export format (PDF/JSON/Cloud)...');
        this.close();
      };
    }

    if (this.btnDemo) {
      this.btnDemo.onclick = () => {
        if (confirm('Add the Alps Demo to your journeys?')) {
          journeyState.loadDemoJourney();
        }
        this.close();
      };
    }
  }

  toggle() {
    const isHidden = this.menu.classList.contains('hidden');
    if (isHidden) {
      this.open();
    } else {
      this.close();
    }
  }

  open() {
    this.menu.classList.remove('hidden');
    this.trigger.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-blue-600');
  }

  close() {
    this.menu.classList.add('hidden');
    this.trigger.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-blue-600');
  }
}

export const menuController = new MenuController();
