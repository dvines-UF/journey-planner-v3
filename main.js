import './style.css';
import { journeyState } from './core/journeyState.js';
import { eventBus } from './core/eventBus.js';
import './ui/timeline.js';
import './ui/map.js';
import './ui/calendar.js';
import './ui/bottomNav.js';
import './ui/dashboard.js';
import './ui/theme.js';
import './ui/menu.js';
import './ui/tickets.js';
import './core/viewOrchestrator.js';
import './ui/discovery.js';
import './ui/hotelPicker.js';


// Header Logic: Sync Title
eventBus.on('JOURNEY_LOADED', (payload) => {
  const titleEl = document.getElementById('journey-title');
  if (titleEl && payload.journey) {
    titleEl.textContent = payload.journey.title;
  } else if (titleEl) {
    titleEl.textContent = 'Journey Planner';
  }
});

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

// Boot the application
document.addEventListener('DOMContentLoaded', () => {
  // Load collection and migrate legacy data if needed
  journeyState.loadFromLocal();
});
