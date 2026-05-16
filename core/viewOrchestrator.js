import { eventBus } from './eventBus.js';

/**
 * UI View Orchestrator
 * 
 * LAYOUT INVARIANT: The timeline sidebar is ALWAYS visible.
 * The right canvas switches between Map, Calendar, and Tickets.
 * "Plan" is not a separate layout — it just means "show the Map canvas."
 */
class ViewOrchestrator {
  constructor() {
    this.canvasViews = {
      'map': 'map-container',
      'calendar': 'calendar-container',
      'tickets': 'tickets-container'
    };

    this.activeCanvas = 'map';
    this.leftCanvasArea = document.getElementById('left-canvas-area');
    this.timelineContainer = document.getElementById('timeline-container');

    eventBus.on('NAVIGATE_TO', (payload) => this.switchView(payload.view));
    this.setupMobileInteractions();
  }

  switchView(viewName) {
    const isMobile = window.innerWidth < 768;

    // Normalize: "plan" means "show map canvas"
    const canvasName = (viewName === 'plan') ? 'map' : viewName;
    
    if (!this.canvasViews[canvasName]) return;
    this.activeCanvas = canvasName;

    // 1. ALWAYS show containers (CSS handles layout)
    this.timelineContainer.classList.remove('hidden');
    this.leftCanvasArea.classList.remove('hidden');

    // 2. Hide all canvas children, then reveal the active one
    Object.values(this.canvasViews).forEach(containerId => {
      const el = document.getElementById(containerId);
      if (el) el.classList.add('hidden');
    });

    const activeEl = document.getElementById(this.canvasViews[canvasName]);
    if (activeEl) activeEl.classList.remove('hidden');

    // 3. Side-Bar Logic (Mobile Bottom Sheet vs Desktop Sidebar)
    if (canvasName === 'map') {
      this.timelineContainer.classList.add('bottom-sheet');
    } else {
      this.timelineContainer.classList.remove('bottom-sheet', 'expanded');
    }

    // 4. Notify all components
    eventBus.emit('VIEW_CHANGED', { view: canvasName, navView: viewName, isMobile });
  }

  setupMobileInteractions() {
    // Toggle bottom sheet on mobile when in map view
    this.timelineContainer.addEventListener('click', (e) => {
      if (window.innerWidth < 768 && this.timelineContainer.classList.contains('bottom-sheet')) {
        // If clicking a button, input, or specifically the 'view map' button inside card, don't toggle sheet
        if (e.target.closest('button, input, [role="button"]')) return;
        this.timelineContainer.classList.toggle('expanded');
      }
    });
  }
}

export const viewOrchestrator = new ViewOrchestrator();
