const db = require("../../database");

// Predict project profit
function predictProjectProfit(projectId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
         p.amount as revenue,
         p.material_cost,
         p.labor_cost,
         p.expense_cost,
         p.total_cost,
         p.profit,
         p.profit_margin
       FROM projects p
       WHERE p.id = ?`,
      [projectId],
      (err, project) => {
        if (err) return reject(err);
        if (!project) return resolve(null);

        const predictedProfit = Number(project.revenue || 0) - Number(project.total_cost || 0);
        const profitMargin = project.revenue ? (predictedProfit / project.revenue) * 100 : 0;
        
        let riskLevel = "low";
        if (profitMargin < 10) riskLevel = "high";
        else if (profitMargin < 20) riskLevel = "medium";

        resolve({
          revenue: project.revenue,
          estimatedCost: project.total_cost,
          predictedProfit,
          profitMargin,
          riskLevel,
        });
      }
    );
  });
}

// Predict profit from calculation
function predictProfitFromCalculation(data) {
  const { materials = [], labor = 0, expenses = 0, transport = 0, equipment = 0, otherCosts = 0, margin = 30 } = data;
  
  const materialCost = materials.reduce((sum, m) => sum + Number(m.total_cost || 0), 0);
  const totalCost = materialCost + Number(labor) + Number(expenses) + Number(transport) + Number(equipment) + Number(otherCosts);
  const sellingPrice = totalCost * (1 + margin / 100);
  const predictedProfit = sellingPrice - totalCost;
  const profitMargin = sellingPrice ? (predictedProfit / sellingPrice) * 100 : 0;
  
  let riskLevel = "low";
  if (profitMargin < 10) riskLevel = "high";
  else if (profitMargin < 20) riskLevel = "medium";

  return {
    revenue: sellingPrice,
    estimatedCost: totalCost,
    predictedProfit,
    profitMargin,
    riskLevel,
  };
}

// Compare estimated vs actual
function compareEstimatedVsActual(projectId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
         p.amount as estimated_revenue,
         p.total_cost as estimated_cost,
         COALESCE(SUM(pm.total_cost), 0) as actual_material_cost,
         COALESCE(SUM(pe.amount), 0) as actual_expense_cost,
         COALESCE(SUM(pw.total_cost), 0) as actual_labor_cost
       FROM projects p
       LEFT JOIN project_materials pm ON p.id = pm.project_id
       LEFT JOIN project_expenses pe ON p.id = pe.project_id
       LEFT JOIN project_workers pw ON p.id = pw.project_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [projectId],
      (err, row) => {
        if (err) return reject(err);
        
        const actualTotalCost = Number(row?.actual_material_cost || 0) + 
                                Number(row?.actual_expense_cost || 0) + 
                                Number(row?.actual_labor_cost || 0);
        const estimatedTotalCost = Number(row?.estimated_cost || 0);
        const variance = actualTotalCost - estimatedTotalCost;
        
        resolve({
          estimatedCost: estimatedTotalCost,
          actualCost: actualTotalCost,
          variance,
          variancePercent: estimatedTotalCost ? (variance / estimatedTotalCost) * 100 : 0,
        });
      }
    );
  });
}

module.exports = {
  predictProjectProfit,
  predictProfitFromCalculation,
  compareEstimatedVsActual,
};