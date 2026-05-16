/**
 * ui/discovery.js
 * AI Discovery — Placeholder button for future feature.
 */

import { eventBus } from '../core/eventBus.js';

class DiscoveryUI {
  constructor() {
    this.button = null;
    this.toast = null;
    this.bindEvents();
  }

  bindEvents() {
    eventBus.on('VIEW_CHANGED', (payload) => {
      const navTarget = payload.navView || payload.view;
      if (navTarget === 'map') {
        this.ensureButton();
        this.button.classList.remove('hidden');
      } else if (this.button) {
        this.button.classList.add('hidden');
      }
    });
  }

  ensureButton() {
    if (this.button) return;

    this.button = document.createElement('button');
    this.button.id = 'btn-ai-discover';
    this.button.className = 'hidden fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 bg-gradient-to-br from-violet-600 to-blue-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-violet-500/30 font-bold text-sm flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all border border-white/20';
    this.button.innerHTML = `
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Generate Ideas
    `;

    this.button.onclick = () => this.showComingSoon();
    document.body.appendChild(this.button);
  }

  showComingSoon() {
    // Remove existing toast if any
    if (this.toast && document.body.contains(this.toast)) {
      document.body.removeChild(this.toast);
    }

    this.toast = document.createElement('div');
    this.toast.className = 'fixed bottom-40 right-6 md:bottom-24 md:right-8 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 animate-scale-up max-w-xs';
    this.toast.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg class="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <p class="font-black text-sm">AI Discovery</p>
          <p class="text-xs text-slate-400 mt-1 font-medium">This feature is coming soon — the AI will suggest activities, restaurants, and hidden gems based on your vibe.</p>
        </div>
      </div>
    `;

    document.body.appendChild(this.toast);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      if (this.toast && document.body.contains(this.toast)) {
        this.toast.style.opacity = '0';
        this.toast.style.transform = 'translateY(10px)';
        this.toast.style.transition = 'opacity 0.3s, transform 0.3s';
        setTimeout(() => {
          if (this.toast && document.body.contains(this.toast)) {
            document.body.removeChild(this.toast);
          }
        }, 300);
      }
    }, 4000);
  }
}

export const discoveryUI = new DiscoveryUI();
