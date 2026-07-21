// =======================================
// EVENTS SERVICE ENTRY POINT
// =======================================

const eventBus = require("./eventBus");
const eventHandlers = require("./eventHandlers");

module.exports = {
  eventBus,
  eventHandlers
};