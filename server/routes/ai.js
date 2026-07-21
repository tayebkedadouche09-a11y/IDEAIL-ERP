const express = require("express");
const router = express.Router();
const db = require("../database");
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
    res.json(prediction || { message: "Project not found or no data available" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project risk
router.get("/project/:id/risk", async (req, res) => {
  try {
    const projectId = req.params.id;
    const risks = await detectProjectRisk(projectId);
    res.json(risks || { message: "Project not found" });
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
      getTopProfitableProjects(5).catch(() => []),
      getBestClients(5).catch(() => []),
      getBestSystems(5).catch(() => []),
      getHighestCostMaterials(5).catch(() => []),
      getLossMakingProjects(5).catch(() => []),
    ]);

    res.json({
      topProfitableProjects: topProjects || [],
      bestClients: bestClients || [],
      bestSystems: bestSystems || [],
      highestCostMaterials: highCostMaterials || [],
      lossMakingProjects: lossProjects || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get business recommendations
router.get("/recommendations", async (req, res) => {
  try {
    const recommendations = await generateBusinessRecommendations();
    res.json(recommendations || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SALES FORECASTING (Phase 61)
// ==========================================

// Get sales forecast
router.get("/forecast/sales", async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const forecast = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           strftime('%Y-%m', invoice_date) as month,
           SUM(amount) as total_sales,
           COUNT(*) as invoice_count
         FROM invoices 
         WHERE status = 'paid'
         GROUP BY strftime('%Y-%m', invoice_date)
         ORDER BY month DESC
         LIMIT ?`,
        [parseInt(months)],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Calculate trend and forecast next months
    const totalSales = forecast.reduce((sum, row) => sum + (row.total_sales || 0), 0);
    const avgMonthly = forecast.length > 0 ? totalSales / forecast.length : 0;

    // Generate future predictions
    const predictions = [];
    const lastMonth = forecast[0]?.month || new Date().toISOString().slice(0, 7);
    const [year, month] = lastMonth.split("-").map(Number);

    for (let i = 1; i <= 3; i++) {
      const nextMonth = month + i;
      const nextYear = year + Math.floor(nextMonth / 12);
      const adjustedMonth = ((nextMonth - 1) % 12) + 1;
      predictions.push({
        month: `${nextYear}-${String(adjustedMonth).padStart(2, "0")}`,
        predicted_sales: Math.round(avgMonthly),
      });
    }

    res.json({
      historical: forecast,
      predicted: predictions,
      summary: {
        avg_monthly_sales: Math.round(avgMonthly),
        total_sales_current_period: totalSales,
        trend: "stable",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// LOW STOCK PREDICTION (Phase 64)
// ==========================================

// Get low stock predictions
router.get("/predictions/low-stock", async (req, res) => {
  try {
    const predictions = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           p.id,
           p.name,
           p.current_stock,
           p.minimum_stock,
           p.purchase_price,
           sm.monthly_usage,
           CASE 
             WHEN sm.monthly_usage > 0 THEN p.current_stock / sm.monthly_usage
             ELSE NULL 
           END as days_until_stockout
         FROM products p
         LEFT JOIN (
           SELECT 
             product_id,
             SUM(quantity) as monthly_usage
           FROM stock_movements 
           WHERE movement_type = 'usage' 
           AND date >= date('now', '-30 days')
           GROUP BY product_id
         ) sm ON p.id = sm.product_id
         WHERE p.current_stock <= p.minimum_stock OR p.current_stock = 0
         ORDER BY p.current_stock ASC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({
      predictions: predictions || [],
      summary: {
        total_low_stock: predictions?.length || 0,
        critical_items: predictions?.filter(p => p.current_stock <= 0).length || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// BUSINESS QUERY METRICS (Phase 61)
// ==========================================

// Get business metrics for AI queries
router.get("/business-metrics", async (req, res) => {
  try {
    const metrics = await new Promise(async (resolve, reject) => {
      const results = {};

      // Revenue
      db.get("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid'", [], (err, row) => {
        results.totalRevenue = row?.total || 0;

        // Expenses
        db.get("SELECT COALESCE(SUM(total_amount), 0) as total FROM expenses", [], (err, row2) => {
          results.totalExpenses = row2?.total || 0;

          // Active projects
          db.get("SELECT COUNT(*) as count FROM projects WHERE status = 'in_progress'", [], (err, row3) => {
            results.activeProjects = row3?.count || 0;

            // Low stock items
            db.get("SELECT COUNT(*) as count FROM products WHERE current_stock <= minimum_stock", [], (err, row4) => {
              results.lowStockItems = row4?.count || 0;

              // Pending payments
              db.get("SELECT COALESCE(SUM(remaining_amount), 0) as total FROM invoices WHERE status != 'paid'", [], (err, row5) => {
                results.pendingPayments = row5?.total || 0;

                // Overdue invoices
                db.get("SELECT COUNT(*) as count FROM invoices WHERE due_date < date('now') AND status != 'paid'", [], (err, row6) => {
                  results.overdueInvoices = row6?.count || 0;

                  resolve(results);
                });
              });
            });
          });
        });
      });
    });

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Answer business questions
router.post("/query", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const metrics = await new Promise(async (resolve, reject) => {
      const results = {};
      db.get("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid'", [], (err, row) => {
        results.totalRevenue = row?.total || 0;
        resolve(results);
      });
    });

    // Simple pattern matching for common business questions
    const lowerQuestion = question.toLowerCase();
    let answer = "";

    if (lowerQuestion.includes("revenue") || lowerQuestion.includes("sales")) {
      answer = `Total revenue: ${metrics.totalRevenue.toLocaleString()} DA`;
    } else if (lowerQuestion.includes("profit")) {
      db.get("SELECT COALESCE(SUM(amount), 0) as revenue FROM invoices WHERE status = 'paid'", [], (err, revRow) => {
        db.get("SELECT COALESCE(SUM(total_amount), 0) as expenses FROM expenses", [], (err, expRow) => {
          const profit = (revRow?.revenue || 0) - (expRow?.expenses || 0);
          answer = `Net profit: ${profit.toLocaleString()} DA`;
        });
      });
    } else if (lowerQuestion.includes("project")) {
      db.get("SELECT COUNT(*) as count FROM projects WHERE status = 'in_progress'", [], (err, row) => {
        answer = `Active projects: ${row?.count || 0}`;
      });
    } else if (lowerQuestion.includes("stock")) {
      db.get("SELECT COUNT(*) as count FROM products WHERE current_stock <= minimum_stock", [], (err, row) => {
        answer = `Low stock items: ${row?.count || 0}`;
      });
    } else {
      answer = "Ask me about revenue, profit, projects, or stock.";
    }

    res.json({ question, answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;