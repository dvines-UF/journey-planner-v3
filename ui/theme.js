import { eventBus } from '../core/eventBus.js';

/**
 * Theme Management System
 * Handles Dark/Light mode persistence, UI toggling, and system sync.
 */
class ThemeManager {
  constructor() {
    this.toggleBtn = document.getElementById('btn-theme-toggle');
    this.sunIcon = document.getElementById('sun-icon');
    this.moonIcon = document.getElementById('moon-icon');
    
    // Default to system preference if no saved theme
    const savedTheme = localStorage.getItem('journey_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    this.applyTheme();
    
    if (this.toggleBtn) {
      this.toggleBtn.onclick = () => this.toggle();
    }

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('journey_theme')) {
        this.currentTheme = e.matches ? 'dark' : 'light';
        this.applyTheme();
      }
    });
  }

  toggle() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('journey_theme', this.currentTheme);
    this.applyTheme();
  }

  applyTheme() {
    if (this.currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
      this.sunIcon?.classList.remove('hidden');
      this.moonIcon?.classList.add('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      this.sunIcon?.classList.add('hidden');
      this.moonIcon?.classList.remove('hidden');
    }
    
    // Broadcast for Map/Other modules to react
    eventBus.emit('THEME_CHANGED', { theme: this.currentTheme });
  }
}

export const themeManager = new ThemeManager();
