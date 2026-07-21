const db = require("../../database");

// Calculate project profit automatically
function calculateProjectProfit(projectId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
         p.amount,
         COALESCE(SUM(pm.total_cost), 0) as material_cost,
         COALESCE(SUM(pw.total_cost), 0) as labor_cost,
         COALESCE(SUM(pe.amount), 0) as expense_cost
       FROM projects p
       LEFT JOIN project_materials pm ON p.id = pm.project_id
       LEFT JOIN project_workers pw ON p.id = pw.project_id
       LEFT JOIN project_expenses pe ON p.id = pe.project_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [projectId],
      (err, row) => {
        if (err) return reject(err);
        
        const totalCost = Number(row?.material_cost || 0) + 
                        Number(row?.labor_cost || 0) + 
                        Number(row?.expense_cost || 0);
        const profit = Number(row?.amount || 0) - totalCost;
        const margin = row?.amount ? (profit / row.amount) * 100 : 0;
        
        db.run(
          "UPDATE projects SET total_cost = ?, profit = ?, profit_margin = ? WHERE id = ?",
          [totalCost, profit, margin, projectId],
          function (err) {
            if (err) return reject(err);
            resolve({ profit, margin });
          }
        );
      }
    );
  });
}

module.exports = {
  calculateProjectProfit,
};