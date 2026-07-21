const materialConsumptionService = require("./materialConsumptionService");
const pricingService = require("./pricingService");

module.exports = {
  ...materialConsumptionService,
  ...pricingService,
};