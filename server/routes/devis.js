const express = require("express");
const router = express.Router();
const db = require("../database");
const { eventBus } = require("../services/events");

// Generate devis number: DEV-YYYYMMDD-XXX
function generateDevisNumber(callback) {
  const now = new Date();
  const dateStr =
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  db.get(
    "SELECT COUNT(*) AS count FROM devis WHERE devis_number LIKE ?",
    [`DEV-${dateStr}-%`],
    (err, row) => {
      if (err) return callback(err);
      const num = (row?.count || 0) + 1;
      callback(null, `DEV-${dateStr}-${String(num).padStart(3, "0")}`);
    }
  );
}

// =======================================
// GET /devis - List all devis with search and pagination
// =======================================
router.get("/", (req, res) => {
  const { search = "", page = 1, limit = 20, status: statusFilter } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      d.*,
      c.name AS client_name,
      c.phone AS client_phone,
      p.name AS project_name
    FROM devis d
    LEFT JOIN clients c ON d.client_id = c.id
    LEFT JOIN projects p ON d.project_id = p.id
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM devis d
    LEFT JOIN clients c ON d.client_id = c.id
    LEFT JOIN projects p ON d.project_id = p.id
  `;

  let params = [];
  let countParams = [];
  let whereConditions = [];

  // Add search filter
  if (search && search.trim() !== "") {
    whereConditions.push(`(d.devis_number LIKE ? OR c.name LIKE ? OR p.name LIKE ?)`);
    const searchParam = `%${search}%`;
    params = [searchParam, searchParam, searchParam];
    countParams = [searchParam, searchParam, searchParam];
  }

  // Add status filter
  if (statusFilter && statusFilter !== "all") {
    whereConditions.push(`d.status = ?`);
    params.push(statusFilter);
    countParams.push(statusFilter);
  }

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(" AND ")}`;
    countQuery += ` WHERE ${whereConditions.join(" AND ")}`;
  }

  query += ` ORDER BY d.id DESC LIMIT ? OFFSET ?`;
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
// GET /devis/:id - Get single devis with items
// =======================================
router.get("/:id", (req, res) => {
  db.get(
    `
    SELECT
      d.*,
      c.name AS client_name,
      c.phone AS client_phone,
      c.address AS client_address,
      p.name AS project_name
    FROM devis d
    LEFT JOIN clients c ON d.client_id = c.id
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE d.id = ?
    `,
    [req.params.id],
    (err, devis) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!devis) return res.status(404).json({ error: "Devis not found" });

      db.all(
        "SELECT * FROM devis_items WHERE devis_id = ? ORDER BY id ASC",
        [req.params.id],
        (err, items) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ ...devis, items: items || [] });
        }
      );
    }
  );
});

// =======================================
// POST /devis - Create devis
// =======================================
router.post("/", (req, res) => {
  const { client_id, project_id, title, description, items, valid_until, notes } = req.body;

  if (!client_id) {
    return res.status(400).json({ error: "Client is required" });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "At least one item is required" });
  }

  generateDevisNumber((err, devis_number) => {
    if (err) return res.status(500).json({ error: err.message });

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
      0
    );

    db.run(
      `INSERT INTO devis (devis_number, client_id, project_id, title, description, amount, valid_until, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        devis_number,
        client_id,
        project_id || null,
        title || null,
        description || null,
        totalAmount,
        valid_until || null,
        notes || null,
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const devisId = this.lastID;

        // Insert items
        const stmt = db.prepare(
          "INSERT INTO devis_items (devis_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)"
        );

        let itemsDone = 0;
        items.forEach((item, index) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.unit_price) || 0;
          const total = qty * price;

          stmt.run([devisId, item.description, qty, price, total], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            itemsDone++;
if (itemsDone === items.length) {
              stmt.finalize();
              // Emit QuotationCreated event
              eventBus.emit("QuotationCreated", { devisId: devisId }, db);
              res.json({
                success: true,
                id: devisId,
                devis_number,
                amount: totalAmount,
                message: "Devis created successfully",
              });
            }
          });
        });
      }
    );
  });
});

// =======================================
// PUT /devis/:id - Update devis
// =======================================
router.put("/:id", (req, res) => {
  const { client_id, project_id, title, description, items, valid_until, notes, status } = req.body;
  const devisId = req.params.id;

  // Check if devis exists and can be edited
  db.get("SELECT status FROM devis WHERE id = ?", [devisId], (err, devis) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!devis) return res.status(404).json({ error: "Devis not found" });

    if (devis.status === "accepté" || devis.status === "converti") {
      return res.status(400).json({ error: "Cannot edit an accepted or converted devis" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
      0
    );

    db.run(
      `UPDATE devis SET client_id=?, project_id=?, title=?, description=?, amount=?, status=?, valid_until=?, notes=?, updated_at=datetime('now')
       WHERE id=?`,
      [
        client_id,
        project_id || null,
        title || null,
        description || null,
        totalAmount,
        status || devis.status,
        valid_until || null,
        notes || null,
        devisId,
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        // Delete old items and re-insert
        db.run("DELETE FROM devis_items WHERE devis_id = ?", [devisId], (err) => {
          if (err) return res.status(500).json({ error: err.message });

          const stmt = db.prepare(
            "INSERT INTO devis_items (devis_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)"
          );

          let itemsDone = 0;
          items.forEach((item) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unit_price) || 0;
            const total = qty * price;

            stmt.run([devisId, item.description, qty, price, total], (err) => {
              if (err) return res.status(500).json({ error: err.message });
              itemsDone++;
              if (itemsDone === items.length) {
                stmt.finalize();
                res.json({ success: true, message: "Devis updated successfully", amount: totalAmount });
              }
            });
          });
        });
      }
    );
  });
});

// =======================================
// DELETE /devis/:id
// =======================================
router.delete("/:id", (req, res) => {
  db.get("SELECT status FROM devis WHERE id = ?", [req.params.id], (err, devis) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!devis) return res.status(404).json({ error: "Devis not found" });

    if (devis.status !== "brouillon") {
      return res.status(400).json({ error: "Only draft devis can be deleted" });
    }

    db.run("DELETE FROM devis WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Devis deleted" });
    });
  });
});

// =======================================
// PUT /devis/:id/status - Update status
// =======================================
router.put("/:id/status", (req, res) => {
  const { status } = req.body;
  const validStatuses = ["brouillon", "envoyé", "accepté", "refusé", "converti"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.get("SELECT status FROM devis WHERE id = ?", [req.params.id], (err, devis) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!devis) return res.status(404).json({ error: "Devis not found" });

    // Validate status transitions
    const transitions = {
      brouillon: ["envoyé"],
      envoyé: ["accepté", "refusé"],
      accepté: ["converti"],
      refusé: [],
      converti: [],
    };

    if (!transitions[devis.status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot change status from '${devis.status}' to '${status}'`,
        allowedTransitions: transitions[devis.status] || [],
      });
    }

db.run(
      "UPDATE devis SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Emit QuotationApproved or QuotationRejected event
        if (status === "accepté") {
          eventBus.emit("QuotationApproved", { devisId: req.params.id }, db);
        } else if (status === "refusé") {
          eventBus.emit("QuotationRejected", { devisId: req.params.id }, db);
        }
        
        res.json({ success: true, message: `Devis status changed to '${status}'` });
      }
    );
  });
});

// =======================================
// POST /devis/from-calculation - Create devis from calculation
// =======================================
router.post("/from-calculation", (req, res) => {
  const {
    client_id,
    project_id,
    system_id,
    title,
    description,
    materials = [],
    labor = 0,
    expenses = 0,
    transport = 0,
    equipment = 0,
    otherCosts = 0,
    margin = 30,
    vatRate = 19,
  } = req.body;

  if (!client_id) {
    return res.status(400).json({ error: "Client is required" });
  }

  const { createQuotationFromCalculation } = require("../services/quotation");

  createQuotationFromCalculation({
    client_id,
    project_id,
    system_id,
    title,
    description,
    materials,
    labor,
    expenses,
    transport,
    equipment,
    otherCosts,
    margin,
    vatRate,
  })
    .then((result) => {
      res.json({
        success: true,
        ...result,
        message: "Quotation created from calculation",
      });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

// =======================================
// POST /devis/from-project/:id - Create devis from project
// =======================================
router.post("/from-project/:id", (req, res) => {
  const projectId = req.params.id;
  const { margin = 30 } = req.body;

  const { createQuotationFromProject } = require("../services/quotation");

  createQuotationFromProject(projectId, margin)
    .then((result) => {
      res.json({
        success: true,
        ...result,
        message: "Quotation created from project",
      });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

// =======================================
// POST /devis/:id/convert-to-invoice
// =======================================
router.post("/:id/convert-to-invoice", (req, res) => {
  const devisId = req.params.id;

  db.get(
    `SELECT d.*, c.name AS client_name FROM devis d
     LEFT JOIN clients c ON d.client_id = c.id
     WHERE d.id = ?`,
    [devisId],
    (err, devis) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!devis) return res.status(404).json({ error: "Devis not found" });

      if (devis.status !== "accepté") {
        return res.status(400).json({ error: "Only accepted devis can be converted to invoice" });
      }

      const invoiceNumber = "INV-" + Date.now();

db.run(
        `INSERT INTO invoices (client_id, project_id, invoice_number, amount, status, invoice_date)
         VALUES (?, ?, ?, ?, 'غير مدفوعة', date('now'))`,
        [devis.client_id, devis.project_id, invoiceNumber, devis.amount],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });

          // Update devis status to 'converti'
          db.run(
            "UPDATE devis SET status = 'converti', updated_at = datetime('now') WHERE id = ?",
            [devisId]
          );
          
          // Emit QuotationConverted and InvoiceCreated events
          eventBus.emit("QuotationConverted", { devisId: devisId, invoiceId: this.lastID }, db);
          eventBus.emit("InvoiceCreated", { invoiceId: this.lastID, projectId: devis.project_id }, db);

          res.json({
            success: true,
            invoice_id: this.lastID,
            invoice_number: invoiceNumber,
            message: "Devis converted to invoice successfully",
          });
        }
      );
    }
  );
});

module.exports = router;