/**
 * core/utils.js
 * Standardized utility functions to enforce Safety & Resilience Patterns.
 */

/**
 * Parses a YYYY-MM-DD string into a local Date object without timezone shifts.
 * @param {string} dateStr - e.g. "2026-05-18"
 * @returns {Date}
 */
export function parseDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Formats a date object or string into a pretty local string.
 * @param {string|Date} date - The date to format
 * @param {Object} options - toLocaleDateString options
 * @returns {string}
 */
export function formatDatePretty(date, options = { weekday: 'long', month: 'short', day: 'numeric' }) {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return d.toLocaleDateString('en-US', options);
}

/**
 * Generates a unique ID with an optional prefix.
 * @param {string} prefix - e.g. "day", "pick"
 * @returns {string}
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculates the number of days between two YYYY-MM-DD dates.
 * @param {string} startStr 
 * @param {string} endStr 
 * @returns {number}
 */
export function calculateDaysDuration(startStr, endStr) {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24)) + 1;
}

/**
 * Safely executes a render function and logs errors without crashing the UI.
 * @param {Function} renderFn 
 * @param {any} context - Data for logging
 */
export function safeRender(renderFn, context = null) {
  try {
    return renderFn();
  } catch (e) {
    console.error("SafeRender Failure:", e, context);
    return null;
  }
}
