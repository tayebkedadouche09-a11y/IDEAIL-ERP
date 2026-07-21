const db = require("../../database");

// Update dashboard statistics
function updateDashboardStats() {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
         COUNT(*) as total_projects,
         SUM(amount) as total_revenue,
         SUM(profit) as total_profit
       FROM projects`,
      [],
      (err, stats) => {
        if (err) return reject(err);
        
        db.get(
          `SELECT COUNT(*) as low_stock FROM products WHERE quantity < min_stock`,
          [],
          (err, stock) => {
            if (err) return reject(err);
            
            resolve({
              ...stats,
              lowStock: stock?.low_stock || 0,
            });
          }
        );
      }
    );
  });
}

module.exports = {
  updateDashboardStats,
};