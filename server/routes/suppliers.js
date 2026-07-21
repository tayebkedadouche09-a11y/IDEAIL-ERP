const express = require("express");
const router = express.Router();
const db = require("../database");

// =======================================
// Get all suppliers with search and pagination
// =======================================

router.get("/", (req, res) => {
  const { search = "", page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT *
    FROM suppliers
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM suppliers
  `;

  let params = [];
  let countParams = [];

  // Add search filter
  if (search && search.trim() !== "") {
    query += ` WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR contact_person LIKE ?`;
    const searchParam = `%${search}%`;
    params = [searchParam, searchParam, searchParam, searchParam];
    countParams = [searchParam, searchParam, searchParam, searchParam];
  }

  query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  // Get total count
  db.get(countQuery, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get paginated results
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

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

// =======================================
// Get single supplier
// =======================================

router.get("/:id", (req, res) => {
  db.get("SELECT * FROM suppliers WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json(row);
  });
});

// =======================================
// Create supplier
// =======================================

router.post("/", (req, res) => {
  const {
    name,
    phone,
    email,
    address,
    contact_person,
    registration_number,
    tax_number,
    nif,
    nis,
    rc,
    payment_terms,
    credit_limit,
    bank_name,
    bank_account,
    category,
    status,
    notes
  } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      error: "Supplier name is required"
    });
  }

  db.run(
    `
    INSERT INTO suppliers
    (name, phone, email, address, contact_person, registration_number, tax_number, nif, nis, rc, payment_terms, credit_limit, bank_name, bank_account, category, status, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `,
    [
      name,
      phone || null,
      email || null,
      address || null,
      contact_person || null,
      registration_number || null,
      tax_number || null,
      nif || null,
      nis || null,
      rc || null,
      payment_terms || 30,
      credit_limit || 0,
      bank_name || null,
      bank_account || null,
      category || 'materials',
      status || "active",
      notes || null
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.json({
        success: true,
        id: this.lastID,
        message: "Supplier created successfully"
      });
    }
  );
});

// =======================================
// Update supplier
// =======================================

router.put("/:id", (req, res) => {
  const id = req.params.id;

  const {
    name,
    phone,
    email,
    address,
    contact_person,
    registration_number,
    tax_number,
    nif,
    nis,
    rc,
    payment_terms,
    credit_limit,
    bank_name,
    bank_account,
    category,
    status,
    notes
  } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      error: "Supplier name is required"
    });
  }

  db.run(
    `
    UPDATE suppliers SET
    name=?,
    phone=?,
    email=?,
    address=?,
    contact_person=?,
    registration_number=?,
    tax_number=?,
    nif=?,
    nis=?,
    rc=?,
    payment_terms=?,
    credit_limit=?,
    bank_name=?,
    bank_account=?,
    category=?,
    status=?,
    notes=?
    WHERE id=?
    `,
    [
      name,
      phone || null,
      email || null,
      address || null,
      contact_person || null,
      registration_number || null,
      tax_number || null,
      nif || null,
      nis || null,
      rc || null,
      payment_terms || 30,
      credit_limit || 0,
      bank_name || null,
      bank_account || null,
      category || 'materials',
      status || "active",
      notes || null,
      id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.json({
        success: true,
        message: "Supplier updated successfully"
      });
    }
  );
});

// =======================================
// Delete supplier
// =======================================

router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM suppliers WHERE id=?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.json({
        success: true,
        message: "Supplier deleted"
      });
    }
  );
});

// =======================================
// Supplier statistics
// =======================================

router.get("/stats", (req, res) => {
  const queries = {
    total: "SELECT COUNT(*) as count FROM suppliers",
    active: "SELECT COUNT(*) as count FROM suppliers WHERE status = 'active' OR status = 'نشط'",
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

module.exports = router;