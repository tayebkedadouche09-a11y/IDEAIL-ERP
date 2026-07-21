const scheduler = require("./scheduler");
const dailyAutomation = require("./dailyAutomation");
const weeklyAutomation = require("./weeklyAutomation");
const monthlyAutomation = require("./monthlyAutomation");
const backupAutomation = require("./backupAutomation");
const dashboardAutomation = require("./dashboardAutomation");
const inventoryAutomation = require("./inventoryAutomation");
const notificationAutomation = require("./notificationAutomation");
const profitAutomation = require("./profitAutomation");

module.exports = {
  ...scheduler,
  ...dailyAutomation,
  ...weeklyAutomation,
  ...monthlyAutomation,
  ...backupAutomation,
  ...dashboardAutomation,
  ...inventoryAutomation,
  ...notificationAutomation,
  ...profitAutomation,
};