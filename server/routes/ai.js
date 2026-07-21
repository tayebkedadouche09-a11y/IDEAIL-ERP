const express = require("express");
const router = express.Router();
const {
  predictProjectProfit,
  predictProfitFromCalculation,
  detectProjectRisk,
  detectFinancialRisk,
  detectStockRisk,
  suggestSellingPrice,
  recommendProfitMargin,
  getTopProfitableProjects,
  getBestClients,
  getBestSystems,
  getHighestCostMaterials,
  getLossMakingProjects,
  generateBusinessRecommendations,
} = require("../services/ai");

// Get project profit prediction
router.get("/project/:id/profit-prediction", async (req, res) => {
  try {
    const projectId = req.params.id;
    const prediction = await predictProjectProfit(projectId);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project risk
router.get("/project/:id/risk", async (req, res) => {
  try {
    const projectId = req.params.id;
    const risks = await detectProjectRisk(projectId);
    res.json(risks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pricing recommendation
router.get("/pricing/recommendation", async (req, res) => {
  try {
    const { cost, projectType } = req.query;
    const recommendation = await suggestSellingPrice(Number(cost), projectType);
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI insights
router.get("/insights", async (req, res) => {
  try {
    const [topProjects, bestClients, bestSystems, highCostMaterials, lossProjects] = await Promise.all([
      getTopProfitableProjects(5),
      getBestClients(5),
      getBestSystems(5),
      getHighestCostMaterials(5),
      getLossMakingProjects(5),
    ]);

    res.json({
      topProfitableProjects: topProjects,
      bestClients,
      bestSystems,
      highestCostMaterials: highCostMaterials,
      lossMakingProjects: lossProjects,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get business recommendations
router.get("/recommendations", async (req, res) => {
  try {
    const recommendations = await generateBusinessRecommendations();
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;