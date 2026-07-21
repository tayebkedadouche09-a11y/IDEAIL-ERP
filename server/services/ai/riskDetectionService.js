const db = require("../../database");

// Detect project risk
function detectProjectRisk(projectId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
         p.amount,
         p.total_cost,
         p.profit_margin,
         p.end_date,
         p.status
       FROM projects p
       WHERE p.id = ?`,
      [projectId],
      (err, project) => {
        if (err) return reject(err);
        
        const risks = [];
        
        // Profit risk
        if (project?.profit_margin < 10) {
          risks.push({
            riskType: "profit",
            severity: "high",
            message: "Low profit margin detected",
            recommendation: "Consider increasing price or reducing costs",
          });
        } else if (project?.profit_margin < 20) {
          risks.push({
            riskType: "profit",
            severity: "medium",
            message: "Profit margin is below average",
            recommendation: "Review cost structure",
          });
        }
        
        // Delay risk
        if (project?.end_date) {
          const endDate = new Date(project.end_date);
          const today = new Date();
          const daysLeft = (endDate - today) / (1000 * 60 * 60 * 24);
          
          if (daysLeft < 0 && project?.status !== "مكتمل") {
            risks.push({
              riskType: "delay",
              severity: "high",
              message: "Project deadline has passed",
              recommendation: "Update project timeline or status",
            });
          } else if (daysLeft < 7 && project?.status !== "مكتمل") {
            risks.push({
              riskType: "delay",
              severity: "medium",
              message: "Project deadline is near",
              recommendation: "Accelerate project progress",
            });
          }
        }
        
        resolve(risks);
      }
    );
  });
}

// Detect financial risk
function detectFinancialRisk() {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
         SUM(CASE WHEN p.profit_margin < 0 THEN 1 ELSE 0 END) as loss_projects,
         SUM(CASE WHEN p.profit_margin < 10 THEN 1 ELSE 0 END) as low_margin_projects,
         COUNT(*) as total_projects
       FROM projects p`,
      [],
      (err, row) => {
        if (err) return reject(err);
        
        const risks = [];
        
        if (row?.loss_projects > 0) {
          risks.push({
            riskType: "financial",
            severity: "high",
            message: `${row.loss_projects} projects are at loss`,
            recommendation: "Review pricing strategy",
          });
        }
        
        if (row?.low_margin_projects > 0) {
          risks.push({
            riskType: "financial",
            severity: "medium",
            message: `${row.low_margin_projects} projects have low margin`,
            recommendation: "Optimize cost management",
          });
        }
        
        resolve(risks);
      }
    );
  });
}

// Detect stock risk
function detectStockRisk() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         p.id as product_id,
         p.name as product_name,
         p.quantity as current_stock,
         p.minimum_quantity,
         COALESCE(SUM(pmr.quantity), 0) as reserved
       FROM products p
       LEFT JOIN project_material_reservations pmr ON p.id = pmr.product_id AND pmr.status = 'reserved'
       WHERE p.quantity < p.minimum_quantity OR p.quantity = 0
       GROUP BY p.id`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        
        const risks = rows.map((row) => ({
          riskType: "stock",
          severity: row.current_stock === 0 ? "high" : "medium",
          message: `${row.product_name} is below minimum stock (${row.current_stock} / ${row.minimum_quantity})`,
          recommendation: "Reorder materials",
        }));
        
        resolve(risks);
      }
    );
  });
}

module.exports = {
  detectProjectRisk,
  detectFinancialRisk,
  detectStockRisk,
};