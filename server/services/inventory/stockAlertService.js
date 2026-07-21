const db = require("../../database");
const { eventBus } = require("../events");

// Check low stock
function checkLowStock() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.*, 
               COALESCE(SUM(pmr.quantity), 0) as reserved,
               (p.quantity - COALESCE(SUM(pmr.quantity), 0)) as available
        FROM products p
        LEFT JOIN project_material_reservations pmr ON p.id = pmr.product_id AND pmr.status = 'reserved'
        WHERE p.quantity <= p.minimum_quantity
        GROUP BY p.id`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Check project material shortage
function checkProjectMaterialShortage(projectId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         pm.product_id,
         p.name as product_name,
         p.quantity as current_stock,
         pm.quantity as required,
         (p.quantity - pm.quantity) as shortage
       FROM project_materials pm
       JOIN products p ON pm.product_id = p.id
       WHERE pm.project_id = ? AND p.quantity < pm.quantity`,
      [projectId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Generate stock alerts
function generateStockAlerts() {
  return new Promise(async (resolve, reject) => {
    try {
      const lowStock = await checkLowStock();
      
      // Create alerts for low stock
      const alerts = [];
      for (const item of lowStock) {
        await new Promise((res, rej) => {
          db.run(
            `INSERT INTO stock_alerts (product_id, alert_type, message, severity)
             VALUES (?, 'low_stock', ?, 'warning')`,
            [item.id, `Low stock alert: ${item.name} has ${item.available} units available`],
            function (err) {
              if (err) return rej(err);
              alerts.push({ id: this.lastID, ...item });
              res();
            }
          );
        });
      }

      // Emit event
      eventBus.emit("StockAlertGenerated", { alerts }, db);

      resolve(alerts);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  checkLowStock,
  checkProjectMaterialShortage,
  generateStockAlerts,
};