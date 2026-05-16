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
  }

  switchView(viewName) {
    const isMobile = window.innerWidth < 768;

    // Normalize: "plan" means "show map canvas"
    const canvasName = (viewName === 'plan') ? 'map' : viewName;
    
    if (!this.canvasViews[canvasName]) return;
    this.activeCanvas = canvasName;

    // 1. ALWAYS show the timeline sidebar (UI INVARIANT)
    this.timelineContainer.classList.remove('hidden');

    // 2. ALWAYS show the canvas area
    this.leftCanvasArea.classList.remove('hidden');

    // 3. Hide all canvas children, then reveal the active one
    Object.values(this.canvasViews).forEach(containerId => {
      const el = document.getElementById(containerId);
      if (el) el.classList.add('hidden');
    });

    const activeEl = document.getElementById(this.canvasViews[canvasName]);
    if (activeEl) activeEl.classList.remove('hidden');

    // 4. Discovery mode class for the timeline when map is active
    if (canvasName === 'map') {
      this.timelineContainer.classList.add('timeline-discovery-mode');
    } else {
      this.timelineContainer.classList.remove('timeline-discovery-mode');
    }

    // 5. Mobile: toggle which panel is primary (canvas vs timeline)
    if (isMobile) {
      if (viewName === 'plan') {
        // On mobile, "Plan" means show the timeline full-screen
        this.leftCanvasArea.classList.add('hidden');
        this.timelineContainer.classList.remove('timeline-discovery-mode');
      }
      // Otherwise: canvas is visible, timeline hides on mobile
      // (they can't both fit — but we keep the invariant on desktop)
    }

    // 6. Notify all components
    eventBus.emit('VIEW_CHANGED', { view: canvasName, navView: viewName, isMobile });
  }
}

export const viewOrchestrator = new ViewOrchestrator();
