const db = require("../../database");

// Get inventory value
function getInventoryValue() {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
         COUNT(*) as total_products,
         SUM(quantity * purchase_price) as total_value,
         SUM(quantity * sale_price) as total_sale_value
       FROM products`,
      [],
      (err, row) => {
        if (err) return reject(err);
        resolve(row);
      }
    );
  });
}

// Get material usage report
function getMaterialUsageReport(startDate, endDate) {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT 
        p.name as product_name,
        SUM(mc.quantity) as total_consumed,
        SUM(mc.quantity * p.purchase_price) as total_cost
      FROM material_consumptions mc
      JOIN products p ON mc.product_id = p.id
    `;
    
    const params = [];
    if (startDate && endDate) {
      sql += " WHERE mc.consumption_date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    
    sql += " GROUP BY p.id ORDER BY total_consumed DESC";
    
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Get stock movement report
function getStockMovementReport(startDate, endDate) {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT 
        sm.*,
        p.name as product_name,
        sm.movement_type,
        sm.quantity,
        sm.created_at
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
    `;
    
    const params = [];
    if (startDate && endDate) {
      sql += " WHERE sm.created_at BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    
    sql += " ORDER BY sm.created_at DESC";
    
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Get project consumption report
function getProjectConsumptionReport(projectId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         p.name as product_name,
         mc.quantity,
         mc.consumption_date,
         (mc.quantity * p.purchase_price) as total_cost
       FROM material_consumptions mc
       JOIN products p ON mc.product_id = p.id
       WHERE mc.project_id = ?
       ORDER BY mc.consumption_date DESC`,
      [projectId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

module.exports = {
  getInventoryValue,
  getMaterialUsageReport,
  getStockMovementReport,
  getProjectConsumptionReport,
};