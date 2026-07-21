// =======================================
// NOTIFICATION SERVICE ENTRY POINT
// =======================================

const notificationService = require("./notificationService");
const { NOTIFICATION_TYPES } = require("./notificationTypes");

module.exports = {
  notificationService,
  NOTIFICATION_TYPES
};