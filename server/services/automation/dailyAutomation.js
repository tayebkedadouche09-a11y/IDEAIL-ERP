const db = require("../../database");
const { eventBus } = require("../events");

// Check delayed projects
function checkDelayedProjects() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.id, p.name, p.end_date
       FROM projects p
       WHERE p.end_date < date('now') AND p.status != 'مكتمل'`,
      [],
      (err, projects) => {
        if (err) return reject(err);
        
        projects.forEach((project) => {
          eventBus.emit("ProjectDelayed", { projectId: project.id }, db);
        });
        
        resolve(projects);
      }
    );
  });
}

// Check overdue invoices
function checkOverdueInvoices() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT i.id, i.invoice_number, i.client_id, i.amount
       FROM invoices i
       WHERE i.status = 'غير مدفوعة' AND i.invoice_date < date('now', '-30 days')`,
      [],
      (err, invoices) => {
        if (err) return reject(err);
        
        invoices.forEach((invoice) => {
          eventBus.emit("InvoiceOverdue", { invoiceId: invoice.id }, db);
        });
        
        resolve(invoices);
      }
    );
  });
}

// Calculate completed project profits
function calculateCompletedProjectProfits() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.id, p.name, p.amount
       FROM projects p
       WHERE p.status = 'مكتمل'`,
      [],
      (err, projects) => {
        if (err) return reject(err);
        
        projects.forEach((project) => {
          // Calculate profit for each completed project
          db.get(
            `SELECT 
               COALESCE(SUM(pm.total_cost), 0) as material_cost,
               COALESCE(SUM(pw.total_cost), 0) as labor_cost,
               COALESCE(SUM(pe.amount), 0) as expense_cost
             FROM projects p
             LEFT JOIN project_materials pm ON p.id = pm.project_id
             LEFT JOIN project_workers pw ON p.id = pw.project_id
             LEFT JOIN project_expenses pe ON p.id = pe.project_id
             WHERE p.id = ?`,
            [project.id],
            (err, costs) => {
              if (err) return;
              
              const totalCost = Number(costs.material_cost) + Number(costs.labor_cost) + Number(costs.expense_cost);
              const profit = Number(project.amount) - totalCost;
              
              db.run(
                "UPDATE projects SET total_cost = ?, profit = ? WHERE id = ?",
                [totalCost, profit, project.id]
              );
            }
          );
        });
        
        resolve(projects);
      }
    );
  });
}

module.exports = {
  checkDelayedProjects,
  checkOverdueInvoices,
  calculateCompletedProjectProfits,
};