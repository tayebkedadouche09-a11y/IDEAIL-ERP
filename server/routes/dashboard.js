const express = require("express");
const router = express.Router();
const db = require("../database");

// =======================================
// GET /dashboard/summary
// Main dashboard data
// =======================================
router.get("/summary", (req, res) => {
  const queries = {
    clients: "SELECT COUNT(*) AS count FROM clients",
    projects: "SELECT COUNT(*) AS count FROM projects",
    invoices: "SELECT COUNT(*) AS count FROM invoices",
    employees: "SELECT COUNT(*) AS count FROM employees",
    products: "SELECT COUNT(*) AS count FROM products",
    revenueTotal: "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices",
    revenuePaid:
      "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'مدفوعة'",
    revenuePending:
      "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'غير مدفوعة'",
    projectStatus:
      "SELECT status, COUNT(*) AS count FROM projects GROUP BY status",
    stockAlerts:
      "SELECT id, name, quantity, minimum_quantity FROM products WHERE quantity < minimum_quantity AND minimum_quantity > 0 ORDER BY (quantity * 1.0 / minimum_quantity) ASC LIMIT 10",
    recentInvoices:
      "SELECT invoices.id, invoices.invoice_number, invoices.amount, invoices.status, invoices.invoice_date, clients.name AS client_name FROM invoices LEFT JOIN clients ON invoices.client_id = clients.id ORDER BY invoices.id DESC LIMIT 10",
    totalProfit:
      "SELECT COALESCE(SUM(profit), 0) AS total, COALESCE(AVG(profit_margin), 0) AS avg_margin FROM projects",
  };

  let results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, sql]) => {
    if (key === "projectStatus" || key === "stockAlerts" || key === "recentInvoices") {
      db.all(sql, [], (err, rows) => {
        if (!err) results[key] = rows;
        else results[key] = [];
        completed++;
        if (completed === totalQueries) sendResponse();
      });
    } else {
      db.get(sql, [], (err, row) => {
        if (!err && row) results[key] = row;
        else results[key] = { count: 0, total: 0, avg_margin: 0 };
        completed++;
        if (completed === totalQueries) sendResponse();
      });
    }
  });

  function sendResponse() {
    // Build project status object
    const statusMap = { "جديد": 0, "قيد التنفيذ": 0, "منتهي": 0, "معلق": 0 };
    if (Array.isArray(results.projectStatus)) {
      results.projectStatus.forEach((s) => {
        const key = s.status || "جديد";
        statusMap[key] = s.count;
      });
    }

    // Build stock alerts
    const alerts = Array.isArray(results.stockAlerts)
      ? results.stockAlerts.map((p) => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          minimum: p.minimum_quantity,
          severity:
            p.quantity < p.minimum_quantity * 0.5
              ? "critical"
              : p.quantity < p.minimum_quantity
              ? "warning"
              : "info",
        }))
      : [];

    res.json({
      counts: {
        clients: results.clients?.count || 0,
        projects: results.projects?.count || 0,
        invoices: results.invoices?.count || 0,
        employees: results.employees?.count || 0,
        products: results.products?.count || 0,
      },
      revenue: {
        total: results.revenueTotal?.total || 0,
        paid: results.revenuePaid?.total || 0,
        pending: results.revenuePending?.total || 0,
      },
      profit: {
        total: results.totalProfit?.total || 0,
        avgMargin: Number(results.totalProfit?.avg_margin || 0).toFixed(2),
      },
      projectStatus: statusMap,
      stockAlerts: alerts,
      recentInvoices: Array.isArray(results.recentInvoices)
        ? results.recentInvoices
        : [],
    });
  }
});

// =======================================
// GET /dashboard/revenue
// Monthly revenue for past 12 months
// =======================================
router.get("/revenue", (req, res) => {
  db.all(
    `
    SELECT
      strftime('%Y-%m', invoice_date) AS month,
      COALESCE(SUM(amount), 0) AS revenue
    FROM invoices
    WHERE invoice_date IS NOT NULL
      AND invoice_date >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', invoice_date)
    ORDER BY month ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Fill in missing months with 0
      const monthlyData = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey =
          d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        const found = rows.find((r) => r.month === monthKey);
        monthlyData.push({
          month: monthKey,
          revenue: found ? found.revenue : 0,
        });
      }

      res.json(monthlyData);
    }
  );
});

// =======================================
// GET /dashboard/profit-trend
// Monthly profit trend for past 12 months
// =======================================
router.get("/profit-trend", (req, res) => {
  db.all(
    `
    SELECT
      strftime('%Y-%m', COALESCE(p.end_date, p.start_date, p.created_at)) AS month,
      COALESCE(SUM(p.profit), 0) AS profit,
      COALESCE(SUM(p.total_cost), 0) AS costs,
      COALESCE(SUM(p.amount), 0) AS revenue
    FROM projects p
    WHERE p.created_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', COALESCE(p.end_date, p.start_date, p.created_at))
    ORDER BY month ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const monthlyData = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey =
          d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        const found = rows.find((r) => r.month === monthKey);
        monthlyData.push({
          month: monthKey,
          revenue: found ? found.revenue : 0,
          costs: found ? found.costs : 0,
          profit: found ? found.profit : 0,
        });
      }

      res.json(monthlyData);
    }
  );
});

// =======================================
// GET /dashboard/stats
// Additional dashboard statistics
// =======================================
router.get("/stats", (req, res) => {
  const queries = {
    totalClients: "SELECT COUNT(*) AS count FROM clients",
    totalProjects: "SELECT COUNT(*) AS count FROM projects",
    activeProjects: "SELECT COUNT(*) AS count FROM projects WHERE status = 'قيد التنفيذ'",
    totalInvoices: "SELECT COUNT(*) AS count FROM invoices",
    totalPayments: "SELECT COUNT(*) AS count FROM payments",
    totalExpenses: "SELECT COUNT(*) AS count FROM expenses",
    estimatedProfit: "SELECT COALESCE(SUM(profit), 0) AS total FROM projects",
    stockValue: "SELECT COALESCE(SUM(quantity * purchase_price), 0) AS total FROM products",
    lowStockAlerts: "SELECT COUNT(*) AS count FROM products WHERE quantity < minimum_quantity AND minimum_quantity > 0",
    topProjects: "SELECT id, name, profit FROM projects ORDER BY profit DESC LIMIT 5",
    topClients: "SELECT c.id, c.name, COALESCE(SUM(i.amount), 0) AS total FROM clients c LEFT JOIN invoices i ON c.id = i.client_id GROUP BY c.id ORDER BY total DESC LIMIT 5",
    topSuppliers: "SELECT s.id, s.name, COALESCE(SUM(e.total_amount), 0) AS total FROM suppliers s LEFT JOIN expenses e ON s.id = e.supplier_id GROUP BY s.id ORDER BY total DESC LIMIT 5",
    expenseCategories: "SELECT c.name AS category, COALESCE(SUM(e.total_amount), 0) AS total FROM expense_categories c LEFT JOIN expenses e ON c.id = e.category_id GROUP BY c.id ORDER BY total DESC LIMIT 5",
    overdueInvoices: "SELECT id, invoice_number, amount FROM invoices WHERE status = 'غير مدفوعة' AND invoice_date IS NOT NULL ORDER BY invoice_date ASC LIMIT 5",
    delayedProjects: "SELECT id, name, (julianday('now') - julianday(end_date)) AS days_delayed FROM projects WHERE end_date < date('now') AND status != 'منتهي' ORDER BY days_delayed DESC LIMIT 5",
    upcomingPayments: "SELECT s.name AS supplier, e.total_amount AS amount FROM expenses e JOIN suppliers s ON e.supplier_id = s.id WHERE e.paid_amount < e.total_amount ORDER BY e.expense_date ASC LIMIT 5",
    recentActivity: "SELECT id, message, created_at, user FROM events ORDER BY created_at DESC LIMIT 10",
  };

  let results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, sql]) => {
    if (key === "topProjects" || key === "topClients" || key === "topSuppliers" || key === "expenseCategories" || key === "overdueInvoices" || key === "delayedProjects" || key === "upcomingPayments" || key === "recentActivity") {
      db.all(sql, [], (err, rows) => {
        if (!err) results[key] = rows;
        else results[key] = [];
        completed++;
        if (completed === totalQueries) sendResponse();
      });
    } else {
      db.get(sql, [], (err, row) => {
        if (!err && row) results[key] = row;
        else results[key] = { count: 0, total: 0 };
        completed++;
        if (completed === totalQueries) sendResponse();
      });
    }
  });

  function sendResponse() {
    res.json({
      totalClients: results.totalClients?.count || 0,
      totalProjects: results.totalProjects?.count || 0,
      activeProjects: results.activeProjects?.count || 0,
      totalInvoices: results.totalInvoices?.count || 0,
      totalPayments: results.totalPayments?.count || 0,
      totalExpenses: results.totalExpenses?.count || 0,
      estimatedProfit: results.estimatedProfit?.total || 0,
      stockValue: results.stockValue?.total || 0,
      lowStockAlerts: results.lowStockAlerts?.count || 0,
      topProjects: results.topProjects || [],
      topClients: results.topClients || [],
      topSuppliers: results.topSuppliers || [],
      expenseCategories: results.expenseCategories || [],
      overdueInvoices: results.overdueInvoices || [],
      delayedProjects: results.delayedProjects || [],
      upcomingPayments: results.upcomingPayments || [],
      recentActivity: results.recentActivity || [],
    });
  }
});

module.exports = router;
