const db = require("../../database");

// Create notification
function createNotification(type, title, message) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO notifications (type, title, message) VALUES (?, ?, ?)",
      [type, title, message],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

// Create low stock notification
function notifyLowStock(product) {
  return createNotification("warning", "Low Stock", `${product.name} is below minimum stock`);
}

// Create delayed project notification
function notifyDelayedProject(project) {
  return createNotification("warning", "Delayed Project", `${project.name} deadline has passed`);
}

// Create invoice due notification
function notifyInvoiceDue(invoice) {
  return createNotification("info", "Invoice Due", `Invoice ${invoice.invoice_number} is due`);
}

// Create invoice overdue notification
function notifyInvoiceOverdue(invoice) {
  return createNotification("error", "Invoice Overdue", `Invoice ${invoice.invoice_number} is overdue`);
}

// Create completed project notification
function notifyCompletedProject(project) {
  return createNotification("success", "Project Completed", `${project.name} has been completed`);
}

// Create backup completed notification
function notifyBackupCompleted(backup) {
  return createNotification("success", "Backup Completed", `Backup created: ${backup.file}`);
}

// Create weekly report ready notification
function notifyWeeklyReportReady() {
  return createNotification("info", "Weekly Report", "Weekly report is ready");
}

// Create monthly report ready notification
function notifyMonthlyReportReady() {
  return createNotification("info", "Monthly Report", "Monthly report is ready");
}

module.exports = {
  createNotification,
  notifyLowStock,
  notifyDelayedProject,
  notifyInvoiceDue,
  notifyInvoiceOverdue,
  notifyCompletedProject,
  notifyBackupCompleted,
  notifyWeeklyReportReady,
  notifyMonthlyReportReady,
};