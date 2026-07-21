const express = require("express");
const router = express.Router();
const db = require("../database");
const { eventBus } = require("../services/events");

// =======================================
// GET /financial - Financial summary
// =======================================

router.get("/", (req, res) => {
  const queries = {
    totalRevenue: "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'مدفوعة'",
    pendingRevenue: "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'غير مدفوعة'",
    totalExpenses: "SELECT COALESCE(SUM(total_amount), 0) AS total FROM expenses",
    totalPayments: "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_type = 'client_payment'",
    totalSupplierPayments: "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_type = 'supplier_payment'",
    clientDebt: "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'غير مدفوعة'",
    supplierDebt: "SELECT COALESCE(SUM(total_amount), 0) AS total FROM expenses WHERE paid_amount < total_amount",
  };

  let results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, sql]) => {
    db.get(sql, [], (err, row) => {
      if (!err && row) results[key] = row.total || 0;
      else results[key] = 0;
      completed++;
      if (completed === totalQueries) {
        res.json({
          totalRevenue: results.totalRevenue || 0,
          pendingRevenue: results.pendingRevenue || 0,
          totalExpenses: results.totalExpenses || 0,
          totalPayments: results.totalPayments || 0,
          totalSupplierPayments: results.totalSupplierPayments || 0,
          clientDebt: results.clientDebt || 0,
          supplierDebt: results.supplierDebt || 0,
          netProfit: (results.totalRevenue || 0) - (results.totalExpenses || 0),
        });
      }
    });
  });
});

// =======================================
// SUPPLIERS CRUD
// =======================================

router.get("/suppliers", (req, res) => {
  db.all("SELECT * FROM suppliers ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/suppliers", (req, res) => {
  const { 
    name, phone, email, address, contact_person, notes,
    registration_number, tax_number, nif, nis, rc,
    payment_terms, credit_limit, bank_name, bank_account,
    category, status 
  } = req.body;
  if (!name) return res.status(400).json({ error: "Supplier name is required" });

  db.run(
    `INSERT INTO suppliers (name, phone, email, address, contact_person, notes, registration_number, tax_number, nif, nis, rc, payment_terms, credit_limit, bank_name, bank_account, category, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, phone || null, email || null, address || null, contact_person || null, notes || null,
      registration_number || null, tax_number || null, nif || null, nis || null, rc || null,
      payment_terms || 30, credit_limit || null, bank_name || null, bank_account || null,
      category || 'materials', status || 'نشط'
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Supplier created" });
    }
  );
});

router.put("/suppliers/:id", (req, res) => {
  const { 
    name, phone, email, address, contact_person, status, notes,
    registration_number, tax_number, nif, nis, rc,
    payment_terms, credit_limit, bank_name, bank_account,
    category 
  } = req.body;
  db.run(
    `UPDATE suppliers SET name=?, phone=?, email=?, address=?, contact_person=?, status=?, notes=?, registration_number=?, tax_number=?, nif=?, nis=?, rc=?, payment_terms=?, credit_limit=?, bank_name=?, bank_account=?, category=? WHERE id=?`,
    [name, phone, email, address, contact_person, status, notes, registration_number, tax_number, nif, nis, rc, payment_terms, credit_limit, bank_name, bank_account, category, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Supplier updated" });
    }
  );
});

router.delete("/suppliers/:id", (req, res) => {
  db.run("DELETE FROM suppliers WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Supplier deleted" });
  });
});

// =======================================
// EXPENSE CATEGORIES CRUD
// =======================================

router.get("/expense-categories", (req, res) => {
  db.all("SELECT * FROM expense_categories ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/expense-categories", (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Category name is required" });

  db.run(
    "INSERT INTO expense_categories (name, description) VALUES (?, ?)",
    [name, description || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// =======================================
// EXPENSES CRUD with search and pagination
// =======================================

router.get("/expenses", (req, res) => {
  const { search = "", page = 1, limit = 20, start_date, end_date, category_id, project_id, supplier_id } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT e.*, c.name AS category_name, p.name AS project_name, s.name AS supplier_name
    FROM expenses e
    LEFT JOIN expense_categories c ON e.category_id = c.id
    LEFT JOIN projects p ON e.project_id = p.id
    LEFT JOIN suppliers s ON e.supplier_id = s.id
    WHERE 1=1
  `;
  const params = [];
  const countParams = [];

  // Add search filter
  if (search && search.trim() !== "") {
    sql += " AND (e.title LIKE ? OR e.description LIKE ? OR s.name LIKE ? OR e.receipt_number LIKE ?)";
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
    countParams.push(searchParam, searchParam, searchParam, searchParam);
  }

  if (start_date) {
    sql += " AND e.expense_date >= ?";
    params.push(start_date);
    countParams.push(start_date);
  }
  if (end_date) {
    sql += " AND e.expense_date <= ?";
    params.push(end_date);
    countParams.push(end_date);
  }
  if (category_id) {
    sql += " AND e.category_id = ?";
    params.push(category_id);
    countParams.push(category_id);
  }
  if (project_id) {
    sql += " AND e.project_id = ?";
    params.push(project_id);
    countParams.push(project_id);
  }
  if (supplier_id) {
    sql += " AND e.supplier_id = ?";
    params.push(supplier_id);
    countParams.push(supplier_id);
  }

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM expenses e LEFT JOIN expense_categories c ON e.category_id = c.id LEFT JOIN projects p ON e.project_id = p.id LEFT JOIN suppliers s ON e.supplier_id = s.id WHERE 1=1 ${search ? " AND (e.title LIKE ? OR e.description LIKE ? OR s.name LIKE ? OR e.receipt_number LIKE ?)" : ""}`;
  
  db.get(countSql, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    sql += " ORDER BY e.id DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

router.post("/expenses", (req, res) => {
  const { category_id, project_id, supplier_id, title, description, amount, vat_amount, total_amount, payment_method, expense_date, receipt_number, notes } = req.body;

  if (!title || !amount) {
    return res.status(400).json({ error: "Title and amount are required" });
  }

  const vat = vat_amount || 0;
  const total = total_amount || (Number(amount) + Number(vat));

  db.run(
    `INSERT INTO expenses (category_id, project_id, supplier_id, title, description, amount, vat_amount, total_amount, payment_method, expense_date, receipt_number, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [category_id || null, project_id || null, supplier_id || null, title, description || null, amount, vat, total, payment_method || 'cash', expense_date || null, receipt_number || null, notes || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Create cash movement
      db.run(
        `INSERT INTO cash_movements (movement_type, category, amount, payment_method, reference_id, reference_type, description, movement_date)
         VALUES ('expense', ?, ?, ?, ?, 'expense', ?, ?)`,
        [title, total, payment_method || 'cash', this.lastID, `Expense: ${title}`, expense_date || new Date().toISOString().slice(0, 10)]
      );

      res.json({ success: true, id: this.lastID, message: "Expense recorded" });
    }
  );
});

router.put("/expenses/:id", (req, res) => {
  const { category_id, project_id, supplier_id, title, description, amount, vat_amount, total_amount, payment_method, expense_date, receipt_number, notes } = req.body;

  db.run(
    `UPDATE expenses SET category_id=?, project_id=?, supplier_id=?, title=?, description=?, amount=?, vat_amount=?, total_amount=?, payment_method=?, expense_date=?, receipt_number=?, notes=? WHERE id=?`,
    [category_id, project_id, supplier_id, title, description, amount, vat_amount, total_amount, payment_method, expense_date, receipt_number, notes, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Expense updated" });
    }
  );
});

router.delete("/expenses/:id", (req, res) => {
  db.run("DELETE FROM expenses WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Expense deleted" });
  });
});

// =======================================
// PAYMENTS CRUD with search and pagination
// =======================================

router.get("/payments", (req, res) => {
  const { search = "", page = 1, limit = 20, start_date, end_date, client_id, supplier_id, payment_type } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT p.*, c.name AS client_name, s.name AS supplier_name, i.invoice_number
    FROM payments p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    LEFT JOIN invoices i ON p.invoice_id = i.id
    WHERE 1=1
  `;
  const params = [];
  const countParams = [];

  // Add search filter
  if (search && search.trim() !== "") {
    sql += " AND (c.name LIKE ? OR s.name LIKE ? OR i.invoice_number LIKE ? OR p.reference_number LIKE ?)";
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
    countParams.push(searchParam, searchParam, searchParam, searchParam);
  }

  if (start_date) {
    sql += " AND p.payment_date >= ?";
    params.push(start_date);
    countParams.push(start_date);
  }
  if (end_date) {
    sql += " AND p.payment_date <= ?";
    params.push(end_date);
    countParams.push(end_date);
  }
  if (client_id) {
    sql += " AND p.client_id = ?";
    params.push(client_id);
    countParams.push(client_id);
  }
  if (supplier_id) {
    sql += " AND p.supplier_id = ?";
    params.push(supplier_id);
    countParams.push(supplier_id);
  }
  if (payment_type) {
    sql += " AND p.payment_type = ?";
    params.push(payment_type);
    countParams.push(payment_type);
  }

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM payments p LEFT JOIN clients c ON p.client_id = c.id LEFT JOIN suppliers s ON p.supplier_id = s.id LEFT JOIN invoices i ON p.invoice_id = i.id WHERE 1=1 ${search ? " AND (c.name LIKE ? OR s.name LIKE ? OR i.invoice_number LIKE ? OR p.reference_number LIKE ?)" : ""}`;
  
  db.get(countSql, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    sql += " ORDER BY p.id DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

router.post("/payments", (req, res) => {
  const { payment_type, client_id, supplier_id, invoice_id, amount, payment_method, payment_date, reference_number, notes } = req.body;

  if (!payment_type || !amount) {
    return res.status(400).json({ error: "Payment type and amount are required" });
  }

  db.run(
    `INSERT INTO payments (payment_type, client_id, supplier_id, invoice_id, amount, payment_method, payment_date, reference_number, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [payment_type, client_id || null, supplier_id || null, invoice_id || null, amount, payment_method || 'cash', payment_date || new Date().toISOString().slice(0, 10), reference_number || null, notes || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Create cash movement
      const movementType = payment_type === 'client_payment' ? 'income' : 'expense';
      const description = payment_type === 'client_payment' ? `Payment from client` : `Payment to supplier`;

      db.run(
        `INSERT INTO cash_movements (movement_type, category, amount, payment_method, reference_id, reference_type, description, movement_date)
         VALUES (?, ?, ?, ?, ?, 'payment', ?, ?)`,
        [movementType, payment_type, amount, payment_method || 'cash', this.lastID, description, payment_date || new Date().toISOString().slice(0, 10)]
      );

// If client payment, update invoice status
      if (payment_type === 'client_payment' && invoice_id) {
        db.run(
          `UPDATE invoices SET status = 'مدفوعة' WHERE id = ?`,
          [invoice_id]
        );
      }
      
      // Emit PaymentReceived event
      eventBus.emit("PaymentReceived", { 
        paymentId: this.lastID, 
        invoiceId: invoice_id,
        amount: amount,
        paymentType: payment_type
      }, db);

      res.json({ success: true, id: this.lastID, message: "Payment recorded" });
    }
  );
});

router.put("/payments/:id", (req, res) => {
  const { payment_type, client_id, supplier_id, invoice_id, amount, payment_method, payment_date, reference_number, notes } = req.body;
  const paymentId = req.params.id;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Amount is required and must be positive" });
  }

  db.run(
    `UPDATE payments SET payment_type=?, client_id=?, supplier_id=?, invoice_id=?, amount=?, payment_method=?, payment_date=?, reference_number=?, notes=? WHERE id=?`,
    [payment_type, client_id || null, supplier_id || null, invoice_id || null, amount, payment_method || 'cash', payment_date, reference_number || null, notes || null, paymentId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Emit PaymentUpdated event
      eventBus.emit("PaymentUpdated", { paymentId: paymentId }, db);
      
      res.json({ success: true, message: "Payment updated" });
    }
  );
});

router.delete("/payments/:id", (req, res) => {
  db.run("DELETE FROM payments WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Payment deleted" });
  });
});

// =======================================
// CASH MOVEMENTS
// =======================================

router.get("/cash-movements", (req, res) => {
  const { start_date, end_date, movement_type } = req.query;
  let sql = "SELECT * FROM cash_movements WHERE 1=1";
  const params = [];

  if (start_date) {
    sql += " AND movement_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    sql += " AND movement_date <= ?";
    params.push(end_date);
  }
  if (movement_type) {
    sql += " AND movement_type = ?";
    params.push(movement_type);
  }

  sql += " ORDER BY id DESC LIMIT 100";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/cash-movements", (req, res) => {
  const { movement_type, category, amount, payment_method, description, movement_date } = req.body;

  if (!movement_type || !amount) {
    return res.status(400).json({ error: "Movement type and amount are required" });
  }

  db.run(
    `INSERT INTO cash_movements (movement_type, category, amount, payment_method, description, movement_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [movement_type, category || null, amount, payment_method || 'cash', description || null, movement_date || new Date().toISOString().slice(0, 10)],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Cash movement recorded" });
    }
  );
});

// =======================================
// VAT RECORDS
// =======================================

router.get("/vat-records", (req, res) => {
  db.all("SELECT * FROM vat_records ORDER BY period_start DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/vat-records", (req, res) => {
  const { period_type, period_start, period_end, total_sales, total_vat_collected, total_purchases, total_vat_paid } = req.body;

  if (!period_type || !period_start || !period_end) {
    return res.status(400).json({ error: "Period type, start, and end are required" });
  }

  const vat_due = (total_vat_collected || 0) - (total_vat_paid || 0);

  db.run(
    `INSERT INTO vat_records (period_type, period_start, period_end, total_sales, total_vat_collected, total_purchases, total_vat_paid, vat_due)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [period_type, period_start, period_end, total_sales || 0, total_vat_collected || 0, total_purchases || 0, total_vat_paid || 0, vat_due],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "VAT record created" });
    }
  );
});

// =======================================
// COMPANY SETTINGS
// =======================================

router.get("/settings", (req, res) => {
  db.all("SELECT * FROM company_settings ORDER BY setting_key ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json(settings);
  });
});

router.put("/settings", (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: "Setting key and value are required" });
  }

  db.run(
    `INSERT INTO company_settings (setting_key, setting_value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at`,
    [key, value],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Setting updated" });
    }
  );
});

// =======================================
// CLIENT DEBTS - Unpaid invoices with client info
// =======================================

router.get("/client-debts", (req, res) => {
  const { start_date, end_date } = req.query;
  let sql = `
    SELECT
      i.id,
      i.invoice_number,
      i.amount,
      i.invoice_date,
      i.status,
      c.name AS client_name,
      c.phone AS client_phone,
      COALESCE(SUM(p.amount), 0) AS paid_amount
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN payments p ON p.invoice_id = i.id AND p.payment_type = 'client_payment'
    WHERE i.status = 'غير مدفوعة'
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

  sql += " GROUP BY i.id ORDER BY i.invoice_date ASC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// =======================================
// SUPPLIER DEBTS - Unpaid expenses with supplier info
// =======================================

router.get("/supplier-debts", (req, res) => {
  const { start_date, end_date } = req.query;
  let sql = `
    SELECT
      e.id,
      e.title,
      e.amount,
      e.vat_amount,
      e.total_amount,
      e.expense_date,
      e.paid_amount,
      s.name AS supplier_name,
      c.name AS category_name
    FROM expenses e
    LEFT JOIN suppliers s ON e.supplier_id = s.id
    LEFT JOIN expense_categories c ON e.category_id = c.id
    WHERE e.paid_amount < e.total_amount
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

  sql += " ORDER BY e.expense_date ASC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// =======================================
// PURCHASE ORDERS
// =======================================

router.get("/purchase-orders", (req, res) => {
  const { search = "", page = 1, limit = 20, status: statusFilter, supplier_id } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT po.*, s.name as supplier_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    WHERE 1=1
  `;
  const params = [];
  const countParams = [];

  if (search && search.trim() !== "") {
    sql += " AND (po.po_number LIKE ? OR s.name LIKE ?)";
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam);
    countParams.push(searchParam, searchParam);
  }
  if (statusFilter && statusFilter !== "all") {
    sql += " AND po.status = ?";
    params.push(statusFilter);
    countParams.push(statusFilter);
  }
  if (supplier_id) {
    sql += " AND po.supplier_id = ?";
    params.push(supplier_id);
    countParams.push(supplier_id);
  }

  sql += " ORDER BY po.id DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  db.get(`SELECT COUNT(*) as total FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE 1=1 ${search ? " AND (po.po_number LIKE ? OR s.name LIKE ?)" : ""}`, countParams, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

router.post("/purchase-orders", (req, res) => {
  const { supplier_id, order_date, expected_date, status, subtotal, tax, total, currency, notes, items } = req.body;

  if (!supplier_id) {
    return res.status(400).json({ error: "Supplier is required" });
  }

  // Generate PO number
  const poNumber = "PO-" + Date.now();

  db.run(
    `INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_date, status, subtotal, tax, total, currency, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [poNumber, supplier_id, order_date, expected_date, status || 'draft', subtotal || 0, tax || 0, total || 0, currency || 'DZD', notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Insert items if provided
      if (items && items.length > 0) {
        const stmt = db.prepare(
          `INSERT INTO purchase_order_items (purchase_order_id, product_id, description, quantity, unit, unit_price, discount, tax, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        items.forEach(item => {
          stmt.run(this.lastID, item.product_id, item.description, item.quantity, item.unit, item.unit_price, item.discount, item.tax, item.total);
        });
        stmt.finalize();
      }

      res.json({ success: true, id: this.lastID, po_number: poNumber, message: "Purchase order created" });
    }
  );
});

router.put("/purchase-orders/:id", (req, res) => {
  const { supplier_id, order_date, expected_date, status, subtotal, tax, total, currency, notes } = req.body;

  const updates = [];
  const values = [];

  if (supplier_id !== undefined) { updates.push("supplier_id = ?"); values.push(supplier_id); }
  if (order_date !== undefined) { updates.push("order_date = ?"); values.push(order_date); }
  if (expected_date !== undefined) { updates.push("expected_date = ?"); values.push(expected_date); }
  if (status !== undefined) { updates.push("status = ?"); values.push(status); }
  if (subtotal !== undefined) { updates.push("subtotal = ?"); values.push(subtotal); }
  if (tax !== undefined) { updates.push("tax = ?"); values.push(tax); }
  if (total !== undefined) { updates.push("total = ?"); values.push(total); }
  if (currency !== undefined) { updates.push("currency = ?"); values.push(currency); }
  if (notes !== undefined) { updates.push("notes = ?"); values.push(notes); }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  values.push(req.params.id);

  db.run(`UPDATE purchase_orders SET ${updates.join(", ")} WHERE id = ?`, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Purchase order updated" });
  });
});

router.delete("/purchase-orders/:id", (req, res) => {
  db.run("DELETE FROM purchase_orders WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Purchase order deleted" });
  });
});

// =======================================
// PURCHASE ORDER ITEMS
// =======================================

router.get("/purchase-orders/:id/items", (req, res) => {
  db.all(
    `SELECT poi.*, p.name as product_name FROM purchase_order_items poi LEFT JOIN products p ON poi.product_id = p.id WHERE purchase_order_id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

router.post("/purchase-orders/:id/items", (req, res) => {
  const { product_id, description, quantity, unit, unit_price, discount, tax, total } = req.body;

  db.run(
    `INSERT INTO purchase_order_items (purchase_order_id, product_id, description, quantity, unit, unit_price, discount, tax, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, product_id, description, quantity, unit, unit_price, discount, tax, total],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Item added" });
    }
  );
});

// =======================================
// GOODS RECEIPTS
// =======================================

router.get("/goods-receipts", (req, res) => {
  const { purchase_order_id, supplier_id } = req.query;
  let sql = `SELECT gr.*, s.name as supplier_name, po.po_number FROM goods_receipts gr LEFT JOIN suppliers s ON gr.supplier_id = s.id LEFT JOIN purchase_orders po ON gr.purchase_order_id = po.id WHERE 1=1`;
  const params = [];

  if (purchase_order_id) {
    sql += " AND gr.purchase_order_id = ?";
    params.push(purchase_order_id);
  }
  if (supplier_id) {
    sql += " AND gr.supplier_id = ?";
    params.push(supplier_id);
  }

  sql += " ORDER BY gr.id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/goods-receipts", (req, res) => {
  const { purchase_order_id, supplier_id, receipt_date, reference_number, notes, items } = req.body;

  db.run(
    `INSERT INTO goods_receipts (purchase_order_id, supplier_id, receipt_date, reference_number, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [purchase_order_id, supplier_id, receipt_date, reference_number, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Insert items and update stock
      if (items && items.length > 0) {
        const stmt = db.prepare(
          `INSERT INTO goods_receipt_items (goods_receipt_id, product_id, quantity, unit, notes)
           VALUES (?, ?, ?, ?, ?)`
        );
        items.forEach(item => {
          stmt.run(this.lastID, item.product_id, item.quantity, item.unit, item.notes);
          // Update product stock
          db.run(
            `UPDATE products SET quantity = quantity + ? WHERE id = ?`,
            [item.quantity, item.product_id]
          );
        });
        stmt.finalize();
      }

      res.json({ success: true, id: this.lastID, message: "Goods receipt created" });
    }
  );
});

// =======================================
// SUPPLIER INVOICES
// =======================================

router.get("/supplier-invoices", (req, res) => {
  const { supplier_id, purchase_order_id, status } = req.query;
  let sql = `SELECT si.*, s.name as supplier_name, po.po_number FROM supplier_invoices si LEFT JOIN suppliers s ON si.supplier_id = s.id LEFT JOIN purchase_orders po ON si.purchase_order_id = po.id WHERE 1=1`;
  const params = [];

  if (supplier_id) {
    sql += " AND si.supplier_id = ?";
    params.push(supplier_id);
  }
  if (purchase_order_id) {
    sql += " AND si.purchase_order_id = ?";
    params.push(purchase_order_id);
  }
  if (status) {
    sql += " AND si.status = ?";
    params.push(status);
  }

  sql += " ORDER BY si.id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/supplier-invoices", (req, res) => {
  const { supplier_id, purchase_order_id, invoice_number, invoice_date, due_date, amount, vat_amount, total_amount, status, notes } = req.body;

  db.run(
    `INSERT INTO supplier_invoices (supplier_id, purchase_order_id, invoice_number, invoice_date, due_date, amount, vat_amount, total_amount, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [supplier_id, purchase_order_id, invoice_number, invoice_date, due_date, amount || 0, vat_amount || 0, total_amount || 0, status || 'pending', notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Supplier invoice created" });
    }
  );
});

// =======================================
// SUPPLIER PAYMENTS
// =======================================

router.get("/supplier-payments", (req, res) => {
  const { supplier_id, supplier_invoice_id } = req.query;
  let sql = `SELECT sp.*, s.name as supplier_name, si.invoice_number FROM supplier_payments sp LEFT JOIN suppliers s ON sp.supplier_id = s.id LEFT JOIN supplier_invoices si ON sp.supplier_invoice_id = si.id WHERE 1=1`;
  const params = [];

  if (supplier_id) {
    sql += " AND sp.supplier_id = ?";
    params.push(supplier_id);
  }
  if (supplier_invoice_id) {
    sql += " AND sp.supplier_invoice_id = ?";
    params.push(supplier_invoice_id);
  }

  sql += " ORDER BY sp.id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/supplier-payments", (req, res) => {
  const { supplier_id, supplier_invoice_id, amount, payment_date, payment_method, reference_number, notes } = req.body;

  db.run(
    `INSERT INTO supplier_payments (supplier_id, supplier_invoice_id, amount, payment_date, payment_method, reference_number, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [supplier_id, supplier_invoice_id, amount || 0, payment_date, payment_method || 'cash', reference_number, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Supplier payment recorded" });
    }
  );
});

// =======================================
// SUPPLIER STATISTICS
// =======================================

router.get("/suppliers/stats", (req, res) => {
  const queries = {
    total: "SELECT COUNT(*) as count FROM suppliers",
    active: "SELECT COUNT(*) as count FROM suppliers WHERE status = 'نشط'",
    totalPurchases: "SELECT COALESCE(SUM(total_amount), 0) as total FROM expenses",
    pendingPayments: "SELECT COALESCE(SUM(total_amount - paid_amount), 0) as total FROM expenses WHERE paid_amount < total_amount",
  };

  let results = {};
  let completed = 0;

  Object.entries(queries).forEach(([key, sql]) => {
    db.get(sql, [], (err, row) => {
      if (!err && row) results[key] = row.count || row.total || 0;
      else results[key] = 0;
      completed++;
      if (completed === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// =======================================
// PURCHASE STATISTICS
// =======================================

router.get("/purchases/stats", (req, res) => {
  const queries = {
    totalPO: "SELECT COUNT(*) as count FROM purchase_orders",
    pendingPO: "SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'pending'",
    totalReceived: "SELECT COUNT(*) as count FROM goods_receipts",
    totalInvoices: "SELECT COUNT(*) as count FROM supplier_invoices",
    pendingInvoices: "SELECT COUNT(*) as count FROM supplier_invoices WHERE status = 'pending'",
  };

  let results = {};
  let completed = 0;

  Object.entries(queries).forEach(([key, sql]) => {
    db.get(sql, [], (err, row) => {
      if (!err && row) results[key] = row.count || 0;
      else results[key] = 0;
      completed++;
      if (completed === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// =======================================
// VAT SUMMARY - Automatic VAT calculation
// =======================================

router.get("/vat-summary", (req, res) => {
  const { period_type, period_start, period_end } = req.query;

  // Get VAT rate from settings
  db.get("SELECT setting_value FROM company_settings WHERE setting_key = 'vat_rate'", [], (err, vatSetting) => {
    if (err) return res.status(500).json({ error: err.message });

    const vatRate = Number(vatSetting?.setting_value || 19) / 100;

    // Calculate VAT from invoices (sales)
    let salesSql = `
      SELECT
        COALESCE(SUM(amount), 0) AS total_sales,
        COALESCE(SUM(amount) * ${vatRate}, 0) AS vat_collected
      FROM invoices
      WHERE status = 'مدفوعة'
    `;
    const salesParams = [];

    if (period_start) {
      salesSql += " AND invoice_date >= ?";
      salesParams.push(period_start);
    }
  if (period_end) {
      salesSql += " AND invoice_date <= ?";
      salesParams.push(period_end);
    }

    // Calculate VAT from expenses (purchases)
    let purchaseSql = `
      SELECT
        COALESCE(SUM(total_amount), 0) AS total_purchases,
        COALESCE(SUM(vat_amount), 0) AS vat_paid
      FROM expenses
    `;
    const purchaseParams = [];

    if (period_start) {
      purchaseSql += " AND expense_date >= ?";
      purchaseParams.push(period_start);
    }
    if (period_end) {
      purchaseSql += " AND expense_date <= ?";
      purchaseParams.push(period_end);
    }

    db.get(salesSql, salesParams, (err, sales) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get(purchaseSql, purchaseParams, (err, purchases) => {
        if (err) return res.status(500).json({ error: err.message });

        const vatDue = (sales.vat_collected || 0) - (purchases.vat_paid || 0);

        res.json({
          period_type: period_type || "all",
          period_start: period_start || null,
          period_end: period_end || null,
          vat_rate: vatRate * 100,
          total_sales: sales.total_sales || 0,
          vat_collected: sales.vat_collected || 0,
          total_purchases: purchases.total_purchases || 0,
          vat_paid: purchases.vat_paid || 0,
          vat_due: vatDue,
        });
      });
    });
  });
});

// =======================================
// DASHBOARD FINANCIAL SUMMARY
// =======================================

router.get("/dashboard-summary", (req, res) => {
  const queries = {
    totalRevenue: "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'مدفوعة'",
    pendingRevenue: "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'غير مدفوعة'",
    totalExpenses: "SELECT COALESCE(SUM(total_amount), 0) AS total FROM expenses",
    totalPayments: "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_type = 'client_payment'",
    totalSupplierPayments: "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_type = 'supplier_payment'",
    clientDebt: "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'غير مدفوعة'",
    supplierDebt: "SELECT COALESCE(SUM(total_amount), 0) AS total FROM expenses WHERE paid_amount < total_amount",
  };

  let results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, sql]) => {
    db.get(sql, [], (err, row) => {
      if (!err && row) results[key] = row.total || 0;
      else results[key] = 0;
      completed++;
      if (completed === totalQueries) {
        res.json({
          totalRevenue: results.totalRevenue || 0,
          pendingRevenue: results.pendingRevenue || 0,
          totalExpenses: results.totalExpenses || 0,
          totalPayments: results.totalPayments || 0,
          totalSupplierPayments: results.totalSupplierPayments || 0,
          clientDebt: results.clientDebt || 0,
          supplierDebt: results.supplierDebt || 0,
          netProfit: (results.totalRevenue || 0) - (results.totalExpenses || 0),
        });
      }
    });
  });
});

// =======================================
// DATABASE BACKUP
// =======================================

router.get("/backup", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const dbPath = path.join(__dirname, '..', 'ideail.db');
  const backupPath = path.join(__dirname, '..', 'backups', `backup_${Date.now()}.db`);
  
  // Create backups directory if it doesn't exist
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copy database file
  fs.copyFile(dbPath, backupPath, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      success: true, 
      message: "Database backup created",
      backup_path: backupPath
    });
  });
});

// =======================================
// DATABASE RESTORE
// =======================================

router.post("/restore", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const { backup_path } = req.body;
  const dbPath = path.join(__dirname, '..', 'ideail.db');
  
  if (!backup_path || !fs.existsSync(backup_path)) {
    return res.status(400).json({ error: "Invalid backup path" });
  }
  
  // Restore database file
  fs.copyFile(backup_path, dbPath, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      success: true, 
      message: "Database restored from backup"
    });
  });
});

// =======================================
// LIST BACKUPS
// =======================================

router.get("/backups", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    return res.json([]);
  }
  
  fs.readdir(backupDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
const backups = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .map(f => ({
        filename: f,
        path: path.join(backupDir, f),
        created: new Date(parseInt(f.replace('backup_', '').replace('.db', ''))).getTime()
      }))
      .sort((a, b) => b.created - a.created);
    
    res.json(backups);
  });
});

// =======================================
// EXPORT ENDPOINTS
// =======================================

// Export clients to CSV
router.get("/export/clients", (req, res) => {
  db.all("SELECT * FROM clients ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const header = "id,client_code,name,company_name,phone,email,address,status,created_at\n";
    const csv = rows.map(r => 
      `${r.id},${r.client_code || ''},${r.name || ''},${r.company_name || ''},${r.phone || ''},${r.email || ''},${r.address || ''},${r.status || ''},${r.created_at || ''}`
    ).join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=clients.csv");
    res.send(header + csv);
  });
});

// Export suppliers to CSV
router.get("/export/suppliers", (req, res) => {
  db.all("SELECT * FROM suppliers ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const header = "id,name,category,phone,email,address,status,created_at\n";
    const csv = rows.map(r => 
      `${r.id},${r.name || ''},${r.category || ''},${r.phone || ''},${r.email || ''},${r.address || ''},${r.status || ''},${r.created_at || ''}`
    ).join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=suppliers.csv");
    res.send(header + csv);
  });
});

// Export expenses to CSV
router.get("/export/expenses", (req, res) => {
  db.all(`
    SELECT e.*, c.name AS category_name, s.name AS supplier_name
    FROM expenses e
    LEFT JOIN expense_categories c ON e.category_id = c.id
    LEFT JOIN suppliers s ON e.supplier_id = s.id
    ORDER BY e.id DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const header = "id,title,category,project,supplier,amount,vat,total,payment_method,expense_date,status\n";
    const csv = rows.map(r => 
      `${r.id},${r.title || ''},${r.category_name || ''},${r.project_name || ''},${r.supplier_name || ''},${r.amount || 0},${r.vat_amount || 0},${r.total_amount || 0},${r.payment_method || ''},${r.expense_date || ''},${r.status || ''}`
    ).join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.csv");
    res.send(header + csv);
  });
});

// Export payments to CSV
router.get("/export/payments", (req, res) => {
  db.all(`
    SELECT p.*, c.name AS client_name, s.name AS supplier_name
    FROM payments p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    ORDER BY p.id DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const header = "id,payment_type,client,supplier,amount,payment_method,payment_date,reference\n";
    const csv = rows.map(r => 
      `${r.id},${r.payment_type || ''},${r.client_name || ''},${r.supplier_name || ''},${r.amount || 0},${r.payment_method || ''},${r.payment_date || ''},${r.reference_number || ''}`
    ).join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=payments.csv");
    res.send(header + csv);
  });
});

module.exports = router;
