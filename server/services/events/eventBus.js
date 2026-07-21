// =======================================
// EVENT BUS
// =======================================

const eventHandlers = require("./eventHandlers");

// Event registry
const events = {};

/**
 * Register an event handler
 * @param {string} eventName - Event name
 * @param {function} handler - Handler function
 */
function on(eventName, handler) {
  if (!events[eventName]) {
    events[eventName] = [];
  }
  events[eventName].push(handler);
}

/**
 * Emit an event
 * @param {string} eventName - Event name
 * @param {object} data - Event data
 * @param {object} db - Database connection
 */
function emit(eventName, data, db) {
  // Log event to database
  db.run(
    `INSERT INTO events (event_name, event_data, created_at) VALUES (?, ?, ?)`,
    [eventName, JSON.stringify(data), new Date().toISOString()],
    (err) => {
      if (err) console.error("Error logging event:", err.message);
    }
  );
  
  // Execute handlers
  if (events[eventName]) {
    events[eventName].forEach(handler => {
      try {
        handler(data, db);
      } catch (err) {
        console.error(`Error in event handler for ${eventName}:`, err.message);
      }
    });
  }
}

/**
 * Initialize event handlers
 */
function init(db) {
  eventHandlers.init(db, emit);
}

module.exports = {
  on,
  emit,
  init
};