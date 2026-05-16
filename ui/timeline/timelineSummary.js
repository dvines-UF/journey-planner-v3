import { calculateDaysDuration, parseDate } from '../../core/utils.js';
import { journeyState } from '../../core/journeyState.js';

/**
 * Renders the top overview header for the timeline
 */
export class TimelineSummary {
  /**
   * @param {Object} journey - The active journey data
   */
  static render(journey) {
    const daysDuration = calculateDaysDuration(journey.days[0].date, journey.days[journey.days.length - 1].date);
    const totalCities = new Set(journey.days.map(d => d.city.name)).size;
    
    const startDate = parseDate(journey.days[0].date);
    const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 3600 * 24));
    let countdownText = `${daysUntil} days until departure`;
    if (daysUntil === 0) countdownText = "Your adventure starts today!";
    if (daysUntil < 0) countdownText = `Journey ended ${Math.abs(daysUntil)} days ago`;

    const overview = document.createElement('div');
    overview.className = 'mb-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden animate-fade-in';
    overview.innerHTML = `
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
      <div class="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
      <div class="relative z-10">
        <h2 class="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1.5 text-glow">Journey Status</h2>
        <h1 id="journey-title-editable" class="text-3xl font-black mb-4 tracking-tight drop-shadow-sm text-glow cursor-pointer hover:text-blue-200 transition-colors" title="Click to rename"></h1>
        <div class="flex flex-wrap gap-4 text-sm font-semibold text-slate-200 mb-5">
          <div class="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10 shadow-inner">
             <svg class="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> 
             ${daysDuration} Days
          </div>
          <div class="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10 shadow-inner">
             <svg class="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> 
             ${totalCities} Cities
          </div>
        </div>
        <div class="w-full bg-slate-700/50 rounded-full h-1.5 mb-2 overflow-hidden backdrop-blur-sm">
          <div class="bg-blue-400 h-1.5 rounded-full relative" style="width: ${Math.max(5, Math.min(100, 100 - (daysUntil * 2)))}%">
            <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <p class="text-xs text-blue-200 font-bold tracking-wide">${countdownText}</p>
      </div>
    `;

    // Editable title: set via textContent (XSS-safe), click to edit
    const titleEl = overview.querySelector('#journey-title-editable');
    titleEl.textContent = journey.title || 'My Adventure';

    titleEl.onclick = () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = journey.title || '';
      input.className = 'text-3xl font-black bg-transparent border-b-2 border-blue-400 outline-none text-white w-full tracking-tight';
      input.placeholder = 'Name your journey...';
      
      const commitRename = () => {
        const newTitle = input.value.trim().substring(0, 80) || 'My Adventure';
        journey.title = newTitle;
        journeyState.save();
        // Update the header bar title too
        const headerTitle = document.getElementById('journey-title');
        if (headerTitle) headerTitle.textContent = newTitle;
      };

      input.onblur = commitRename;
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      };
      
      titleEl.replaceWith(input);
      input.focus();
      input.select();
    };

    return overview;
  }
}
