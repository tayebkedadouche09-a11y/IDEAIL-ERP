const express = require("express");
const router = express.Router();
const {
  calculateProjectProfit,
  getProfitSummary,
  calculateMaterialCost,
  calculateLaborCost,
  calculateProjectExpenses,
} = require("../services/profitability");

// Get project profitability summary
router.get("/project/:id", async (req, res) => {
  try {
    const projectId = req.params.id;
    const summary = await getProfitSummary(projectId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get material cost breakdown
router.get("/project/:id/materials", async (req, res) => {
  try {
    const projectId = req.params.id;
    const materials = await calculateMaterialCost(projectId);
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get labor cost breakdown
router.get("/project/:id/labor", async (req, res) => {
  try {
    const projectId = req.params.id;
    const labor = await calculateLaborCost(projectId);
    res.json(labor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project expenses breakdown
router.get("/project/:id/expenses", async (req, res) => {
  try {
    const projectId = req.params.id;
    const expenses = await calculateProjectExpenses(projectId);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;