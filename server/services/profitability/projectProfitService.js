const db = require("../../database");

// Calculate material cost for a project
function calculateMaterialCost(projectId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        pm.id,
        pm.product_id,
        p.name as product_name,
        pm.quantity,
        pm.unit_price,
        pm.total_cost,
        pm.notes
      FROM project_materials pm
      JOIN products p ON pm.product_id = p.id
      WHERE pm.project_id = ?
    `;
    db.all(sql, [projectId], (err, rows) => {
      if (err) return reject(err);
      const total = rows.reduce((sum, r) => sum + (r.total_cost || 0), 0);
      resolve({
        items: rows,
        total: total,
      });
    });
  });
}

// Get material consumption for a project
function getMaterialConsumption(projectId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        p.name as product,
        pm.quantity,
        pm.unit_price,
        pm.total_cost
      FROM project_materials pm
      JOIN products p ON pm.product_id = p.id
      WHERE pm.project_id = ?
    `;
    db.all(sql, [projectId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Calculate labor cost for a project
function calculateLaborCost(projectId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        pw.id,
        pw.employee_id,
        e.name as employee_name,
        pw.days_worked,
        pw.daily_rate,
        pw.total_cost,
        pw.notes
      FROM project_workers pw
      JOIN employees e ON pw.employee_id = e.id
      WHERE pw.project_id = ?
    `;
    db.all(sql, [projectId], (err, rows) => {
      if (err) return reject(err);
      const total = rows.reduce((sum, r) => sum + (r.total_cost || 0), 0);
      resolve({
        items: rows,
        total: total,
      });
    });
  });
}

// Calculate project expenses
function calculateProjectExpenses(projectId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        id,
        title,
        amount,
        expense_date,
        notes
      FROM project_expenses
      WHERE project_id = ?
    `;
    db.all(sql, [projectId], (err, rows) => {
      if (err) return reject(err);
      const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
      resolve({
        items: rows,
        total: total,
      });
    });
  });
}

// Calculate project profit
async function calculateProjectProfit(projectId) {
  try {
    // Get project revenue
    const project = await new Promise((resolve, reject) => {
      db.get("SELECT amount FROM projects WHERE id = ?", [projectId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    const revenue = project?.amount || 0;

    // Calculate all costs
    const [materialCost, laborCost, expenseCost] = await Promise.all([
      calculateMaterialCost(projectId),
      calculateLaborCost(projectId),
      calculateProjectExpenses(projectId),
    ]);

    // Get expenses from expenses table linked to project
    const projectExpenses = await new Promise((resolve, reject) => {
      db.all(
        "SELECT amount FROM expenses WHERE project_id = ?",
        [projectId],
        (err, rows) => {
          if (err) return reject(err);
          const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
          resolve(total);
        }
      );
    });

    // Calculate totals
    const totalMaterialCost = materialCost.total;
    const totalLaborCost = laborCost.total;
    const totalProjectExpenses = expenseCost.total;
    const totalCost = totalMaterialCost + totalLaborCost + totalProjectExpenses + projectExpenses;

    const profit = revenue - totalCost;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

    return {
      revenue,
      materialCost: totalMaterialCost,
      laborCost: totalLaborCost,
      expenseCost: totalProjectExpenses,
      otherExpenses: projectExpenses,
      totalCost,
      profit,
      margin: parseFloat(margin),
    };
  } catch (error) {
    throw error;
  }
}

// Get profit summary for a project
async function getProfitSummary(projectId) {
  try {
    const profit = await calculateProjectProfit(projectId);
    return profit;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  calculateMaterialCost,
  getMaterialConsumption,
  calculateLaborCost,
  calculateProjectExpenses,
  calculateProjectProfit,
  getProfitSummary,
};