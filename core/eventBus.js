// core/eventBus.js

/**
 * EventBus: A simple Publish-Subscribe system to decouple modules.
 * As per ARCHITECTURE.md: Modules NEVER call each other directly. 
 * All communication routes through the eventBus.
 */
class EventBus {
  constructor() {
    this.listeners = {};
  }

  /**
   * Subscribe to an event.
   * @param {string} event - Event name from SCHEMA.md dictionary.
   * @param {Function} callback - Function to execute when event is emitted.
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event - Event name.
   * @param {Function} callback - Function to remove.
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Emit an event to all subscribers.
   * @param {string} event - Event name.
   * @param {Object} payload - Data payload defined in SCHEMA.md.
   */
  emit(event, payload) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error executing listener for event ${event}:`, error);
      }
    });
  }
}

export const eventBus = new EventBus();
