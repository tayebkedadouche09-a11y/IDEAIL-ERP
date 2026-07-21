const db = require("../../database");
const { eventBus } = require("../events");

// Generate weekly report
function generateWeeklyReport() {
  return new Promise(async (resolve, reject) => {
    try {
      // Top clients
      const topClients = await new Promise((res, rej) => {
        db.all(
          `SELECT c.name, SUM(p.profit) as total_profit
           FROM clients c
           JOIN projects p ON c.id = p.client_id
           WHERE p.created_at >= date('now', '-7 days')
           GROUP BY c.id
           ORDER BY total_profit DESC
           LIMIT 5`,
          [],
          (err, rows) => {
            if (err) return rej(err);
            res(rows);
          }
        );
      });

      // Top projects
      const topProjects = await new Promise((res, rej) => {
        db.all(
          `SELECT name, profit
           FROM projects
           WHERE created_at >= date('now', '-7 days')
           ORDER BY profit DESC
           LIMIT 5`,
          [],
          (err, rows) => {
            if (err) return rej(err);
            res(rows);
          }
        );
      });

      // Material usage
      const materialUsage = await new Promise((res, rej) => {
        db.all(
          `SELECT p.name, SUM(pm.quantity) as total_quantity
           FROM products p
           JOIN project_materials pm ON p.id = pm.product_id
           WHERE pm.created_at >= date('now', '-7 days')
           GROUP BY p.id
           ORDER BY total_quantity DESC
           LIMIT 5`,
          [],
          (err, rows) => {
            if (err) return rej(err);
            res(rows);
          }
        );
      });

      // Emit event
      eventBus.emit("WeeklyReportGenerated", { topClients, topProjects, materialUsage }, db);

      resolve({ topClients, topProjects, materialUsage });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateWeeklyReport,
};