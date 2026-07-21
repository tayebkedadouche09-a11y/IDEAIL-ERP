const db = require("../../database");

// Suggest selling price
function suggestSellingPrice(cost, projectType = "general") {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT AVG(profit_margin) as avg_margin
       FROM projects
       WHERE profit_margin > 0`,
      [],
      (err, row) => {
        if (err) return reject(err);
        
        const avgMargin = row?.avg_margin || 30;
        const recommendedMargin = Math.max(avgMargin, 20);
        const recommendedPrice = cost * (1 + recommendedMargin / 100);
        
        resolve({
          recommendedPrice,
          recommendedMargin,
          explanation: `Based on average margin of ${avgMargin.toFixed(1)}% across all projects`,
        });
      }
    );
  });
}

// Recommend profit margin
function recommendProfitMargin(projectType) {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT AVG(profit_margin) as avg_margin,
             COUNT(*) as project_count
      FROM projects
    `;
    
    const params = [];
    if (projectType && projectType !== "general") {
      sql += " WHERE system_id IN (SELECT id FROM systems WHERE type = ?)";
      params.push(projectType);
    }
    
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      
      const avgMargin = row?.avg_margin || 30;
      const recommendedMargin = Math.max(avgMargin, 20);
      
      resolve({
        recommendedMargin,
        projectCount: row?.project_count || 0,
        explanation: `Based on ${row?.project_count || 0} similar projects`,
      });
    });
  });
}

// Compare with previous projects
function compareWithPreviousProjects(projectId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT p.system_id, p.amount, p.profit_margin
       FROM projects p
       WHERE p.id = ?`,
      [projectId],
      (err, project) => {
        if (err) return reject(err);
        
        db.get(
          `SELECT 
             AVG(amount) as avg_amount,
             AVG(profit_margin) as avg_margin,
             COUNT(*) as similar_count
           FROM projects
           WHERE system_id = ? AND id != ?`,
          [project?.system_id, projectId],
          (err, row) => {
            if (err) return reject(err);
            
            resolve({
              currentAmount: project?.amount,
              avgAmount: row?.avg_amount || 0,
              currentMargin: project?.profit_margin,
              avgMargin: row?.avg_margin || 0,
              similarProjects: row?.similar_count || 0,
            });
          }
        );
      }
    );
  });
}

module.exports = {
  suggestSellingPrice,
  recommendProfitMargin,
  compareWithPreviousProjects,
};