const db = require("../../database");
const { eventBus } = require("../events");

// Generate monthly report
function generateMonthlyReport() {
  return new Promise(async (resolve, reject) => {
    try {
      // Revenue report
      const revenue = await new Promise((res, rej) => {
        db.get(
          `SELECT SUM(amount) as total_revenue FROM invoices WHERE invoice_date >= date('now', '-30 days')`,
          [],
          (err, row) => {
            if (err) return rej(err);
            res(row?.total_revenue || 0);
          }
        );
      });

      // Expense report
      const expenses = await new Promise((res, rej) => {
        db.get(
          `SELECT SUM(total_amount) as total_expenses FROM expenses WHERE expense_date >= date('now', '-30 days')`,
          [],
          (err, row) => {
            if (err) return rej(err);
            res(row?.total_expenses || 0);
          }
        );
      });

      // Profit & Loss
      const profit = revenue - expenses;

      // VAT summary
      const vat = await new Promise((res, rej) => {
        db.get(
          `SELECT SUM(vat_amount) as total_vat FROM expenses WHERE expense_date >= date('now', '-30 days')`,
          [],
          (err, row) => {
            if (err) return rej(err);
            res(row?.total_vat || 0);
          }
        );
      });

      // Inventory valuation
      const inventory = await new Promise((res, rej) => {
        db.get(
          `SELECT SUM(quantity * purchase_price) as total_value FROM products`,
          [],
          (err, row) => {
            if (err) return rej(err);
            res(row?.total_value || 0);
          }
        );
      });

      // Emit event
      eventBus.emit("MonthlyReportGenerated", { revenue, expenses, profit, vat, inventory }, db);

      resolve({ revenue, expenses, profit, vat, inventory });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateMonthlyReport,
};