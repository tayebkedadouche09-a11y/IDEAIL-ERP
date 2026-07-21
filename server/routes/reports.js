const express = require("express");
const router = express.Router();
const db = require("../database");
const PDFDocument = require("pdfkit");

// =======================================
// GET /reports - List available reports
// =======================================
router.get("/", (req, res) => {
  res.json({
    reports: [
      { id: "profit-loss", name: "Profit & Loss", path: "/reports/profit-loss" },
      { id: "cash-flow", name: "Cash Flow", path: "/reports/cash-flow" },
      { id: "expense-summary", name: "Expense Summary", path: "/reports/expense-summary" },
      { id: "employee-summary", name: "Employee Summary", path: "/reports/employee-summary" },
      { id: "vehicle-cost", name: "Vehicle Cost", path: "/reports/vehicle-cost" },
      { id: "material-consumption", name: "Material Consumption", path: "/reports/material-consumption" },
      { id: "top-clients", name: "Top Clients", path: "/reports/top-clients" },
      { id: "top-projects", name: "Top Projects", path: "/reports/top-projects" },
      { id: "client-summary", name: "Client Summary", path: "/reports/client-summary" },
      { id: "project-profitability", name: "Project Profitability", path: "/reports/project-profitability" },
      { id: "monthly-revenue", name: "Monthly Revenue", path: "/reports/monthly-revenue" },
      { id: "invoice-aging", name: "Invoice Aging", path: "/reports/invoice-aging" },
      { id: "vat-report", name: "VAT Report", path: "/reports/vat-report" },
      { id: "stock-valuation", name: "Stock Valuation", path: "/reports/stock-valuation" },
    ]
  });
});

// =======================================
// GET /reports/profit-loss
// Profit & Loss by date range
// =======================================
router.get("/profit-loss", (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: "start_date and end_date are required (YYYY-MM-DD)" });
  }

  // Revenue from invoices
  db.get(
    `
    SELECT COALESCE(SUM(amount), 0) AS revenue
    FROM invoices
    WHERE invoice_date >= ? AND invoice_date <= ?
    `,
    [start_date, end_date],
    (err, revenueRow) => {
      if (err) return res.status(500).json({ error: err.message });

      // Costs from projects
      db.get(
        `
        SELECT COALESCE(SUM(total_cost), 0) AS costs
        FROM projects
        WHERE created_at >= ? AND created_at <= ?
        `,
        [start_date, end_date],
        (err, costRow) => {
          if (err) return res.status(500).json({ error: err.message });

          // Expenses
          db.get(
            `
            SELECT COALESCE(SUM(total_amount), 0) AS expenses
            FROM expenses
            WHERE expense_date >= ? AND expense_date <= ?
            `,
            [start_date, end_date],
            (err, expenseRow) => {
              if (err) return res.status(500).json({ error: err.message });

              const revenue = revenueRow?.revenue || 0;
              const costs = costRow?.costs || 0;
              const expenses = expenseRow?.expenses || 0;
              const totalCosts = costs + expenses;
              const profit = revenue - totalCosts;
              const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

              res.json({
                start_date,
                end_date,
                revenue,
                costs,
                expenses,
                totalCosts,
                profit,
                margin: Number(margin),
              });
            }
          );
        }
      );
    }
  );
});

// =======================================
// GET /reports/cash-flow
// Cash Flow report
// =======================================
router.get("/cash-flow", (req, res) => {
  const { start_date, end_date } = req.query;

  let sql = `
    SELECT
      movement_date,
      movement_type,
      category,
      amount,
      payment_method,
      description
    FROM cash_movements
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    sql += " AND movement_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    sql += " AND movement_date <= ?";
    params.push(end_date);
  }

  sql += " ORDER BY movement_date DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const totalIncome = rows.filter(r => r.movement_type === 'income').reduce((s, r) => s + (r.amount || 0), 0);
    const totalExpense = rows.filter(r => r.movement_type === 'expense').reduce((s, r) => s + (r.amount || 0), 0);

    res.json({
      items: rows,
      totalIncome,
      totalExpense,
      netFlow: totalIncome - totalExpense,
    });
  });
});

// =======================================
// GET /reports/expense-summary
// Expense summary by category
// =======================================
router.get("/expense-summary", (req, res) => {
  const { start_date, end_date } = req.query;

  let sql = `
    SELECT
      c.name AS category_name,
      COALESCE(SUM(e.total_amount), 0) AS total_amount,
      COUNT(*) AS count
    FROM expenses e
    LEFT JOIN expense_categories c ON e.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    sql += " AND e.expense_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    sql += " AND e.expense_date <= ?";
    params.push(end_date);
  }

  sql += " GROUP BY c.id, c.name ORDER BY total_amount DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const total = rows.reduce((s, r) => s + (r.total_amount || 0), 0);

    res.json({
      items: rows,
      total,
    });
  });
});

// =======================================
// GET /reports/employee-summary
// Employee summary report
// =======================================
router.get("/employee-summary", (req, res) => {
  const { start_date, end_date } = req.query;

  let sql = `
    SELECT
      e.id,
      e.name,
      e.job_title,
      e.status,
      COALESCE(SUM(pw.days_worked), 0) AS total_days,
      COALESCE(SUM(pw.total_cost), 0) AS total_cost,
      COALESCE(SUM(ep.amount), 0) AS total_paid
    FROM employees e
    LEFT JOIN project_workers pw ON e.id = pw.employee_id
    LEFT JOIN employee_payments ep ON e.id = ep.employee_id
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    sql += " AND (pw.start_date >= ? OR ep.payment_date >= ?)";
    params.push(start_date, start_date);
  }
  if (end_date) {
    sql += " AND (pw.end_date <= ? OR ep.payment_date <= ?)";
    params.push(end_date, end_date);
  }

  sql += " GROUP BY e.id ORDER BY total_cost DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      items: rows,
    });
  });
});

// =======================================
// GET /reports/vehicle-cost
// Vehicle cost report
// =======================================
router.get("/vehicle-cost", (req, res) => {
  const { start_date, end_date } = req.query;

  let sql = `
    SELECT
      v.id,
      v.registration_number,
      v.brand,
      v.model,
      v.status,
      v.purchase_price,
      v.fuel_budget,
      v.insurance_cost,
      COALESCE(SUM(e.total_amount), 0) AS total_expenses,
      COALESCE(SUM(e.amount), 0) AS fuel_costs
    FROM vehicles v
    LEFT JOIN expenses e ON v.id = e.vehicle_id
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    sql += " AND e.expense_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    sql += " AND e.expense_date <= ?";
    params.push(end_date);
  }

  sql += " GROUP BY v.id ORDER BY total_expenses DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      items: rows,
    });
  });
});

// =======================================
// GET /reports/material-consumption
// Material consumption report
// =======================================
router.get("/material-consumption", (req, res) => {
  const { start_date, end_date, project_id } = req.query;

  let sql = `
    SELECT
      p.name AS product_name,
      p.category,
      COALESCE(SUM(mc.quantity), 0) AS total_consumed,
      COALESCE(SUM(mc.quantity * p.purchase_price), 0) AS total_cost
    FROM material_consumptions mc
    LEFT JOIN products p ON mc.product_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    sql += " AND mc.consumption_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    sql += " AND mc.consumption_date <= ?";
    params.push(end_date);
  }
  if (project_id) {
    sql += " AND mc.project_id = ?";
    params.push(project_id);
  }

  sql += " GROUP BY p.id ORDER BY total_consumed DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      items: rows,
    });
  });
});

// =======================================
// GET /reports/top-clients
// Top clients by revenue
// =======================================
router.get("/top-clients", (req, res) => {
  const { start_date, end_date, limit = 10 } = req.query;

  let sql = `
    SELECT
      c.id,
      c.name,
      c.phone,
      c.address,
      COALESCE(SUM(i.amount), 0) AS total_invoiced,
      COALESCE(SUM(CASE WHEN i.status = 'مدفوعة' THEN i.amount ELSE 0 END), 0) AS total_paid,
      COALESCE(SUM(CASE WHEN i.status = 'غير مدفوعة' THEN i.amount ELSE 0 END), 0) AS total_pending
    FROM clients c
    LEFT JOIN invoices i ON c.id = i.client_id
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    sql += " AND i.invoice_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    sql += " AND i.invoice_date <= ?";
    params.push(end_date);
  }

  sql += " GROUP BY c.id ORDER BY total_invoiced DESC LIMIT ?";
  params.push(parseInt(limit));

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      items: rows,
    });
  });
});

// =======================================
// GET /reports/top-projects
// Top projects by profit
// =======================================
router.get("/top-projects", (req, res) => {
  const { limit = 10 } = req.query;

  const sql = `
    SELECT
      p.id,
      p.name,
      c.name AS client_name,
      p.status,
      p.amount,
      p.total_cost,
      p.profit,
      p.profit_margin
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    ORDER BY p.profit DESC
    LIMIT ?
  `;

  db.all(sql, [parseInt(limit)], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      items: rows,
    });
  });
});

// =======================================
// GET /reports/client-summary/:id
// Client transaction summary
// =======================================
router.get("/client-summary/:id", (req, res) => {
  const clientId = req.params.id;

  db.get(
    `
    SELECT
      COUNT(*) AS project_count,
      COALESCE(SUM(amount), 0) AS total_projects_value
    FROM projects
    WHERE client_id = ?
    `,
    [clientId],
    (err, projectSummary) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get(
        `
        SELECT
          COUNT(*) AS invoice_count,
          COALESCE(SUM(amount), 0) AS total_invoiced,
          COALESCE(SUM(CASE WHEN status = 'مدفوعة' THEN amount ELSE 0 END), 0) AS total_paid,
          COALESCE(SUM(CASE WHEN status = 'غير مدفوعة' THEN amount ELSE 0 END), 0) AS total_pending
        FROM invoices
        WHERE client_id = ?
        `,
        [clientId],
        (err, invoiceSummary) => {
          if (err) return res.status(500).json({ error: err.message });

          db.get(
            "SELECT name, phone, email, address FROM clients WHERE id = ?",
            [clientId],
            (err, client) => {
              if (err) return res.status(500).json({ error: err.message });
              if (!client) return res.status(404).json({ error: "Client not found" });

              const balance = (invoiceSummary?.total_invoiced || 0) - (invoiceSummary?.total_paid || 0);

              res.json({
                client,
                projects: projectSummary || {},
                invoices: invoiceSummary || {},
                balance,
              });
            }
          );
        }
      );
    }
  );
});

// =======================================
// GET /reports/project-profitability
// All projects with profit margins
// =======================================
router.get("/project-profitability", (req, res) => {
  db.all(
    `
    SELECT
      p.id,
      p.name,
      p.status,
      p.amount,
      p.total_cost,
      p.profit,
      p.profit_margin,
      c.name AS client_name,
      p.start_date,
      p.end_date
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    ORDER BY p.profit DESC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// =======================================
// GET /reports/monthly-revenue
// Revenue grouped by month (12 months)
// =======================================
router.get("/monthly-revenue", (req, res) => {
  db.all(
    `
    SELECT
      strftime('%Y-%m', invoice_date) AS month,
      COALESCE(SUM(amount), 0) AS revenue,
      COUNT(*) AS invoice_count
    FROM invoices
    WHERE invoice_date IS NOT NULL
      AND invoice_date >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', invoice_date)
    ORDER BY month ASC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      // Fill missing months
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
          invoice_count: found ? found.invoice_count : 0,
        });
      }

      res.json(monthlyData);
    }
  );
});

// =======================================
// GET /reports/invoice-aging
// Aging report: 30/60/90+ days overdue
// =======================================
router.get("/invoice-aging", (req, res) => {
  db.all(
    `
    SELECT
      invoices.id,
      invoices.invoice_number,
      invoices.amount,
      invoices.status,
      invoices.invoice_date,
      clients.name AS client_name,
      CAST(julianday('now') - julianday(invoices.invoice_date) AS INTEGER) AS days_overdue
    FROM invoices
    LEFT JOIN clients ON invoices.client_id = clients.id
    WHERE invoices.status = 'غير مدفوعة'
      AND invoices.invoice_date IS NOT NULL
    ORDER BY days_overdue DESC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const buckets = {
        current: [],
        days_30: [],
        days_60: [],
        days_90: [],
      };

      rows.forEach((inv) => {
        const days = inv.days_overdue || 0;
        if (days <= 30) buckets.current.push(inv);
        else if (days <= 60) buckets.days_30.push(inv);
        else if (days <= 90) buckets.days_60.push(inv);
        else buckets.days_90.push(inv);
      });

      const totals = {
        current: buckets.current.reduce((s, i) => s + i.amount, 0),
        days_30: buckets.days_30.reduce((s, i) => s + i.amount, 0),
        days_60: buckets.days_60.reduce((s, i) => s + i.amount, 0),
        days_90: buckets.days_90.reduce((s, i) => s + i.amount, 0),
      };

      res.json({
        invoices: rows,
        buckets,
        totals,
        totalOverdue: rows.reduce((s, i) => s + i.amount, 0),
      });
    }
  );
});

// =======================================
// GET /reports/vat-report
// VAT report by period
// =======================================
router.get("/vat-report", (req, res) => {
  const { start_date, end_date } = req.query;

  // Get VAT rate from settings
  db.get("SELECT setting_value FROM company_settings WHERE setting_key = 'vat_rate'", [], (err, vatSetting) => {
    if (err) return res.status(500).json({ error: err.message });

    const vatRate = Number(vatSetting?.setting_value || 19) / 100;

    // Calculate VAT from invoices (sales)
    let salesSql = `
      SELECT
        i.invoice_date,
        i.invoice_number,
        i.amount,
        (i.amount * ${vatRate}) AS vat_amount,
        c.name AS client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.status = 'مدفوعة'
    `;
    const salesParams = [];

    if (start_date) {
      salesSql += " AND i.invoice_date >= ?";
      salesParams.push(start_date);
    }
    if (end_date) {
      salesSql += " AND i.invoice_date <= ?";
      salesParams.push(end_date);
    }
    salesSql += " ORDER BY i.invoice_date DESC";

    // Calculate VAT from expenses (purchases)
    let purchaseSql = `
      SELECT
        e.expense_date,
        e.title,
        e.total_amount,
        e.vat_amount,
        s.name AS supplier_name,
        c.name AS category_name
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      LEFT JOIN expense_categories c ON e.category_id = c.id
    `;
    const purchaseParams = [];

    if (start_date) {
      purchaseSql += " WHERE e.expense_date >= ?";
      purchaseParams.push(start_date);
    }
    if (end_date) {
      if (purchaseParams.length > 0) {
        purchaseSql += " AND e.expense_date <= ?";
      } else {
        purchaseSql += " WHERE e.expense_date <= ?";
      }
      purchaseParams.push(end_date);
    }
    purchaseSql += " ORDER BY e.expense_date DESC";

    db.all(salesSql, salesParams, (err, sales) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(purchaseSql, purchaseParams, (err, purchases) => {
        if (err) return res.status(500).json({ error: err.message });

        const totalSales = sales.reduce((s, i) => s + (i.amount || 0), 0);
        const totalVatCollected = sales.reduce((s, i) => s + (i.vat_amount || 0), 0);
        const totalPurchases = purchases.reduce((s, e) => s + (e.total_amount || 0), 0);
        const totalVatPaid = purchases.reduce((s, e) => s + (e.vat_amount || 0), 0);
        const vatDue = totalVatCollected - totalVatPaid;

        res.json({
          period: { start_date: start_date || null, end_date: end_date || null },
          vat_rate: vatRate * 100,
          total_sales: totalSales,
          vat_collected: totalVatCollected,
          total_purchases: totalPurchases,
          vat_paid: totalVatPaid,
          vat_due: vatDue,
          sales: sales,
          purchases: purchases,
        });
      });
    });
  });
});

// =======================================
// GET /reports/stock-valuation
// Inventory value report
// =======================================
router.get("/stock-valuation", (req, res) => {
  db.all(
    `
    SELECT
      p.id,
      p.name,
      p.category,
      p.quantity,
      p.purchase_price,
      p.sale_price,
      (p.quantity * p.purchase_price) AS cost_value,
      (p.quantity * p.sale_price) AS retail_value
    FROM products p
    WHERE p.quantity > 0
    ORDER BY cost_value DESC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalCost = rows.reduce((s, p) => s + (p.cost_value || 0), 0);
      const totalRetail = rows.reduce((s, p) => s + (p.retail_value || 0), 0);

      res.json({
        items: rows,
        totalCost,
        totalRetail,
        potentialProfit: totalRetail - totalCost,
        itemCount: rows.length,
      });
    }
  );
});

// =======================================
// GET /reports/export/:type
// Export report as CSV
// =======================================
router.get("/export/:type", (req, res) => {
  const { type } = req.params;
  const { start_date, end_date } = req.query;
  let csvContent = "";
  let filename = "";

  const queries = {
    "profit-loss": `
      SELECT 
        COALESCE(SUM(i.amount), 0) AS revenue,
        COALESCE(SUM(p.total_cost), 0) AS costs,
        COALESCE(SUM(e.total_amount), 0) AS expenses,
        COALESCE(SUM(i.amount), 0) - COALESCE(SUM(p.total_cost), 0) - COALESCE(SUM(e.total_amount), 0) AS profit
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN expenses e ON 1=1
    `,
    "project-profitability": `
      SELECT p.name, c.name, p.status, p.amount, p.total_cost, p.profit, p.profit_margin
      FROM projects p LEFT JOIN clients c ON p.client_id = c.id
    `,
    "invoice-aging": `
      SELECT i.invoice_number, c.name, i.amount,
        CAST(julianday('now') - julianday(i.invoice_date) AS INTEGER) AS days_overdue,
        i.status
      FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.status = 'غير مدفوعة'
    `,
    "stock-valuation": `
      SELECT p.name, p.category, p.quantity, p.purchase_price,
        (p.quantity * p.purchase_price) AS cost_value,
        (p.quantity * p.sale_price) AS retail_value
      FROM products p WHERE p.quantity > 0
    `,
    "vat-report": `
      SELECT
        COALESCE(SUM(amount), 0) AS total_sales,
        COALESCE(SUM(amount) * 0.19, 0) AS vat_collected,
        0 AS total_purchases,
        0 AS vat_paid,
        COALESCE(SUM(amount) * 0.19, 0) AS vat_due
      FROM invoices
      WHERE status = 'مدفوعة'
    `,
    "cash-flow": `
      SELECT movement_date, movement_type, category, amount, payment_method, description
      FROM cash_movements
      ORDER BY movement_date DESC
    `,
    "expense-summary": `
      SELECT c.name AS category_name, COALESCE(SUM(e.total_amount), 0) AS total_amount, COUNT(*) AS count
      FROM expenses e LEFT JOIN expense_categories c ON e.category_id = c.id
      GROUP BY c.id, c.name
    `,
    "employee-summary": `
      SELECT e.name, e.job_title, COALESCE(SUM(pw.total_cost), 0) AS total_cost,
        COALESCE(SUM(ep.amount), 0) AS total_paid
      FROM employees e
      LEFT JOIN project_workers pw ON e.id = pw.employee_id
      LEFT JOIN employee_payments ep ON e.id = ep.employee_id
      GROUP BY e.id
    `,
    "vehicle-cost": `
      SELECT v.registration_number, v.brand, v.model,
        COALESCE(SUM(e.total_amount), 0) AS total_expenses
      FROM vehicles v LEFT JOIN expenses e ON v.id = e.vehicle_id
      GROUP BY v.id
    `,
    "top-clients": `
      SELECT c.name, COALESCE(SUM(i.amount), 0) AS total_invoiced,
        COALESCE(SUM(CASE WHEN i.status = 'مدفوعة' THEN i.amount ELSE 0 END), 0) AS total_paid
      FROM clients c LEFT JOIN invoices i ON c.id = i.client_id
      GROUP BY c.id
      ORDER BY total_invoiced DESC
    `,
  };

  if (!queries[type]) {
    return res.status(400).json({ error: "Invalid report type" });
  }

  db.all(queries[type], [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (rows.length > 0) {
      csvContent = Object.keys(rows[0]).join(",") + "\n";
      rows.forEach((row) => {
        csvContent += Object.values(row).join(",") + "\n";
      });
    }

    filename = `${type}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(csvContent);
  });
});

// =======================================
// GET /reports/pdf/:type
// Export report as PDF
// =======================================
router.get("/pdf/:type", (req, res) => {
  const { type } = req.params;
  const { start_date, end_date } = req.query;

  const doc = new PDFDocument({
    size: "A4",
    margin: 50
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=${type}.pdf`);
  doc.pipe(res);

  // Get company info
  db.get("SELECT * FROM company_info LIMIT 1", [], (err, company) => {
    doc.fontSize(20)
      .text(company?.company_name || "IDEAIL ERP", {
        align: "center"
      });
    doc.moveDown(2);

    doc.fontSize(16)
      .text(`Report: ${type.replace(/-/g, ' ').toUpperCase()}`, {
        align: "center"
      });
    doc.moveDown();

    if (start_date && end_date) {
      doc.fontSize(10)
        .text(`Period: ${start_date} to ${end_date}`);
      doc.moveDown();
    }

    // Fetch report data
    let sql = "";
    switch (type) {
      case "profit-loss":
        sql = `
          SELECT
            COALESCE(SUM(i.amount), 0) AS revenue,
            COALESCE(SUM(p.total_cost), 0) AS costs,
            COALESCE(SUM(e.total_amount), 0) AS expenses
          FROM invoices i
          LEFT JOIN projects p ON i.project_id = p.id
          LEFT JOIN expenses e ON 1=1
          WHERE i.invoice_date >= ? AND i.invoice_date <= ?
        `;
        break;
      case "project-profitability":
        sql = `
          SELECT p.name, c.name AS client_name, p.amount, p.total_cost, p.profit
          FROM projects p LEFT JOIN clients c ON p.client_id = c.id
        `;
        break;
      default:
        doc.text("Report not available in PDF format");
        doc.end();
        return;
    }

    const params = (start_date && end_date) ? [start_date, end_date] : [];

    db.all(sql, params, (err, rows) => {
      if (err) {
        doc.text("Error generating report: " + err.message);
        doc.end();
        return;
      }

      if (rows.length > 0) {
        doc.fontSize(12);
        rows.forEach((row) => {
          doc.text(JSON.stringify(row));
        });
      }

      doc.moveDown(2);
      doc.text("Generated by IDEAIL ERP", {
        align: "center"
      });
      doc.end();
    });
  });
});

module.exports = router;