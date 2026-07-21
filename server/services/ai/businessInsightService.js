const db = require("../../database");

// Get top profitable projects
function getTopProfitableProjects(limit = 5) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         p.id,
         p.name,
         p.profit,
         p.profit_margin,
         c.name as client_name
       FROM projects p
       JOIN clients c ON p.client_id = c.id
       WHERE p.profit > 0
       ORDER BY p.profit DESC
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Get best clients
function getBestClients(limit = 5) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         c.id,
         c.name,
         COUNT(p.id) as project_count,
         SUM(p.profit) as total_profit,
         AVG(p.profit_margin) as avg_margin
       FROM clients c
       JOIN projects p ON c.id = p.client_id
       WHERE p.profit > 0
       GROUP BY c.id
       ORDER BY total_profit DESC
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Get best systems
function getBestSystems(limit = 5) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         s.id,
         s.name,
         COUNT(p.id) as project_count,
         AVG(p.profit_margin) as avg_margin,
         SUM(p.profit) as total_profit
       FROM systems s
       JOIN projects p ON s.id = p.system_id
       WHERE p.profit > 0
       GROUP BY s.id
       ORDER BY avg_margin DESC
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Get highest cost materials
function getHighestCostMaterials(limit = 5) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         p.id,
         p.name,
         SUM(pm.total_cost) as total_cost,
         SUM(pm.quantity) as total_quantity
       FROM products p
       JOIN project_materials pm ON p.id = pm.product_id
       GROUP BY p.id
       ORDER BY total_cost DESC
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Get loss making projects
function getLossMakingProjects(limit = 5) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         p.id,
         p.name,
         p.profit,
         p.profit_margin,
         c.name as client_name
       FROM projects p
       JOIN clients c ON p.client_id = c.id
       WHERE p.profit < 0
       ORDER BY p.profit ASC
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Generate business recommendations
function generateBusinessRecommendations() {
  return new Promise(async (resolve, reject) => {
    try {
      const recommendations = [];
      
      // Check for loss making projects
      const lossProjects = await getLossMakingProjects(3);
      if (lossProjects.length > 0) {
        recommendations.push({
          type: "warning",
          title: "Loss Making Projects",
          description: `${lossProjects.length} projects are at loss. Review pricing strategy.`,
        });
      }
      
      // Check for low margin projects
      const lowMargin = await new Promise((res, rej) => {
        db.get(
          `SELECT COUNT(*) as count FROM projects WHERE profit_margin < 10`,
          [],
          (err, row) => {
            if (err) return rej(err);
            res(row?.count || 0);
          }
        );
      });
      
      if (lowMargin > 0) {
        recommendations.push({
          type: "info",
          title: "Low Margin Projects",
          description: `${lowMargin} projects have margins below 10%. Consider optimization.`,
        });
      }
      
      // Check for best client
      const bestClient = await getBestClients(1);
      if (bestClient.length > 0) {
        recommendations.push({
          type: "success",
          title: "Top Client",
          description: `${bestClient[0].name} generates highest profit. Prioritize this client.`,
        });
      }
      
      resolve(recommendations);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getTopProfitableProjects,
  getBestClients,
  getBestSystems,
  getHighestCostMaterials,
  getLossMakingProjects,
  generateBusinessRecommendations,
};