const reservationService = require("./reservationService");
const consumptionService = require("./consumptionService");
const stockAlertService = require("./stockAlertService");
const inventoryReportService = require("./inventoryReportService");

module.exports = {
  ...reservationService,
  ...consumptionService,
  ...stockAlertService,
  ...inventoryReportService,
};