const profitPredictionService = require("./profitPredictionService");
const pricingRecommendationService = require("./pricingRecommendationService");
const riskDetectionService = require("./riskDetectionService");
const businessInsightService = require("./businessInsightService");

module.exports = {
  ...profitPredictionService,
  ...pricingRecommendationService,
  ...riskDetectionService,
  ...businessInsightService,
};