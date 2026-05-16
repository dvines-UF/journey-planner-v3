import { eventBus } from '../core/eventBus.js';
import { journeyState } from '../core/journeyState.js';

/**
 * Tickets Component
 * Manages the display and addition of travel documents.
 */
class Tickets {
  constructor() {
    this.container = document.getElementById('tickets-container');
    if (!this.container) return;

    this.render();
    eventBus.on('JOURNEY_LOADED', (payload) => this.update(payload.journey));
  }

  update(journey) {
    if (!journey) return;
    this.render(journey.tickets || []);
  }

  async handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Convert to Base64 for local persistence (Draft Mode)
    const reader = new FileReader();
    reader.onload = (event) => {
      journeyState.addTicket({
        name: file.name,
        type: file.type.includes('image') ? 'image' : 'document',
        data: event.target.result
      });
    };
    reader.readAsDataURL(file);
  }

  render(tickets = []) {
    if (tickets.length === 0) {
      this.container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full animate-fade-in">
          <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
             <svg class="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
          </div>
          <h3 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Your Ticket Wallet</h3>
          <p class="text-slate-500 dark:text-slate-400 mt-2 max-w-xs font-medium">Keep your boarding passes and confirmations in one place.</p>
          <label class="mt-8 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            Upload Ticket (PDF/IMG)
            <input type="file" class="hidden" id="ticket-upload-input" accept=".pdf,image/*">
          </label>
        </div>
      `;
    } else {
      this.container.innerHTML = `
        <div class="w-full max-w-3xl mx-auto p-6 animate-fade-in">
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Wallet</h3>
            <label class="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <svg class="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              <input type="file" class="hidden" id="ticket-upload-input" accept=".pdf,image/*">
            </label>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${tickets.map(ticket => `
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-900 transition-all">
                <div class="w-12 h-12 bg-blue-50 dark:bg-blue-950 rounded-2xl flex items-center justify-center text-blue-600">
                   <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <div class="flex-1 overflow-hidden">
                  <h4 class="font-bold text-slate-900 dark:text-white truncate">${ticket.name}</h4>
                  <p class="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">${ticket.type}</p>
                </div>
                <button class="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="View Ticket">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Bind upload event
    const input = this.container.querySelector('#ticket-upload-input');
    if (input) {
      input.addEventListener('change', (e) => this.handleFileUpload(e));
    }
  }
}

export const tickets = new Tickets();
