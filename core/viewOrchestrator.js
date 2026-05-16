import { eventBus } from './eventBus.js';

/**
 * UI View Orchestrator
 * Standardizes how different application views (Plan, Map, Calendar, etc.) are activated.
 * Reduces coupling between navigation components and UI containers.
 */
class ViewOrchestrator {
  constructor() {
    this.views = {
      'plan': { containerId: 'timeline-container', type: 'primary' },
      'map': { containerId: 'map-container', type: 'canvas' },
      'calendar': { containerId: 'calendar-container', type: 'canvas' },
      'tickets': { containerId: 'tickets-container', type: 'canvas' }
    };

    this.activeView = 'plan';
    this.leftCanvasArea = document.getElementById('left-canvas-area');
    this.timelineContainer = document.getElementById('timeline-container');

    eventBus.on('NAVIGATE_TO', (payload) => this.switchView(payload.view));
  }

  switchView(viewName) {
    const view = this.views[viewName];
    if (!view) return;

    const isMobile = window.innerWidth < 768;
    this.activeView = viewName;

    // 1. Hide all canvas views
    Object.values(this.views).forEach(v => {
      const el = document.getElementById(v.containerId);
      if (el) el.classList.add('hidden');
    });

    // 2. Manage Layout state
    if (viewName === 'plan') {
      this.timelineContainer.classList.remove('hidden', 'timeline-discovery-mode');
      if (isMobile) {
        this.leftCanvasArea.classList.add('hidden');
      }
    } else {
      // It's a canvas view (Map, Calendar, Tickets)
      this.leftCanvasArea.classList.remove('hidden');
      const activeEl = document.getElementById(view.containerId);
      if (activeEl) activeEl.classList.remove('hidden');
      
      // If it's Map, keep Timeline as a Discovery Rail
      if (viewName === 'map') {
        this.timelineContainer.classList.remove('hidden');
        this.timelineContainer.classList.add('timeline-discovery-mode');
      } else if (isMobile) {
        this.timelineContainer.classList.add('hidden');
        this.timelineContainer.classList.remove('timeline-discovery-mode');
      }
    }

    // 3. Notify components (e.g., Map resize)
    eventBus.emit('VIEW_CHANGED', { view: viewName, isMobile });
  }
}

export const viewOrchestrator = new ViewOrchestrator();
