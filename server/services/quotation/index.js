const quotationService = require("./quotationService");
const quotationCalculationService = require("./quotationCalculationService");

module.exports = {
  ...quotationService,
  ...quotationCalculationService,
};