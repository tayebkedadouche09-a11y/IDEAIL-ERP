const express = require("express");
const router = express.Router();
const db = require("../database");
const { eventBus } = require("../services/events");

// =======================================
// GET ALL INVOICES with search and pagination
// =======================================
router.get("/", (req, res) => {
  const { search = "", page = 1, limit = 20, status: statusFilter } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      invoices.*,
      clients.name AS client_name,
      clients.phone AS client_phone,
      clients.address AS client_address,
      projects.name AS project_name,
      COALESCE((
        SELECT SUM(amount) 
        FROM payments 
        WHERE invoice_id = invoices.id AND payment_type = 'client_payment'
      ), 0) AS paid_amount
    FROM invoices
    LEFT JOIN clients ON invoices.client_id = clients.id
    LEFT JOIN projects ON invoices.project_id = projects.id
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM invoices
    LEFT JOIN clients ON invoices.client_id = clients.id
    LEFT JOIN projects ON invoices.project_id = projects.id
  `;

  let params = [];
  let countParams = [];
  let whereConditions = [];

  // Add search filter
  if (search && search.trim() !== "") {
    whereConditions.push(`(invoices.invoice_number LIKE ? OR clients.name LIKE ? OR projects.name LIKE ?)`);
    const searchParam = `%${search}%`;
    params = [searchParam, searchParam, searchParam];
    countParams = [searchParam, searchParam, searchParam];
  }

  // Add status filter
  if (statusFilter && statusFilter !== "all") {
    whereConditions.push(`invoices.status = ?`);
    params.push(statusFilter);
    countParams.push(statusFilter);
  }

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(" AND ")}`;
    countQuery += ` WHERE ${whereConditions.join(" AND ")}`;
  }

  query += ` ORDER BY invoices.id DESC LIMIT ? OFFSET ?`;
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
// GET SINGLE INVOICE with items
// =======================================
router.get("/:id", (req, res) => {
  db.get(
    `
    SELECT
      invoices.*,
      clients.name AS client_name,
      clients.phone AS client_phone,
      clients.address AS client_address,
      projects.name AS project_name
    FROM invoices
    LEFT JOIN clients ON invoices.client_id = clients.id
    LEFT JOIN projects ON invoices.project_id = projects.id
    WHERE invoices.id = ?
    `,
    [req.params.id],
    (err, invoice) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Get invoice items
      db.all(
        "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC",
        [req.params.id],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ ...invoice, items: items || [] });
        }
      );
    }
  );
});

// =======================================
// CREATE INVOICE
// =======================================
router.post("/", (req, res) => {
  const {
    client_id,
    project_id,
    amount,
    status,
    invoice_date,
    vat_amount,
    discount,
    notes,
    items
  } = req.body;

  if (!client_id) {
    return res.status(400).json({ error: "Client is required" });
  }

  // Generate invoice number
  const invoiceNumber = "INV-" + Date.now();

  // Calculate totals
  const totalAmount = Number(amount) || 0;
  const vat = Number(vat_amount) || 0;
  const discountAmount = Number(discount) || 0;
  const finalAmount = totalAmount + vat - discountAmount;

  db.run(
    `
    INSERT INTO invoices
    (client_id, project_id, invoice_number, amount, vat_amount, discount, status, invoice_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      client_id,
      project_id || null,
      invoiceNumber,
      finalAmount,
      vat,
      discountAmount,
      status || "Draft",
      invoice_date || new Date().toISOString().slice(0, 10),
      notes || ""
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const invoiceId = this.lastID;

      // Insert items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const stmt = db.prepare(
          "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)"
        );

        items.forEach((item) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.unit_price) || 0;
          const total = qty * price;
          stmt.run([invoiceId, item.description, qty, price, total]);
        });

        stmt.finalize();
      }

      // Emit InvoiceCreated event
      eventBus.emit("InvoiceCreated", { invoiceId: invoiceId, projectId: project_id }, db);

      res.json({
        success: true,
        id: invoiceId,
        invoice_number: invoiceNumber,
        amount: finalAmount,
        message: "Invoice created successfully"
      });
    }
  );
});

// =======================================
// CREATE INVOICE FROM QUOTATION
// =======================================
router.post("/from-quotation/:id", (req, res) => {
  const devisId = req.params.id;

  db.get(
    `
    SELECT d.*, c.name AS client_name
    FROM devis d
    LEFT JOIN clients c ON d.client_id = c.id
    WHERE d.id = ?
    `,
    [devisId],
    (err, devis) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!devis) {
        return res.status(404).json({ error: "Quotation not found" });
      }
      if (devis.status !== "accepté") {
        return res.status(400).json({ error: "Only accepted quotations can be converted to invoices" });
      }

      // Check if invoice already exists for this quotation
      db.get(
        "SELECT id FROM invoices WHERE devis_id = ?",
        [devisId],
        (err, existingInvoice) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          if (existingInvoice) {
            return res.status(400).json({ error: "Invoice already exists for this quotation" });
          }

          const invoiceNumber = "INV-" + Date.now();

          db.run(
            `
            INSERT INTO invoices
            (client_id, project_id, devis_id, invoice_number, amount, status, invoice_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              devis.client_id,
              devis.project_id,
              devisId,
              invoiceNumber,
              devis.amount,
              "Issued",
              new Date().toISOString().slice(0, 10),
              devis.notes || ""
            ],
            function (err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              const invoiceId = this.lastID;

              // Copy devis items to invoice items
              db.all(
                "SELECT * FROM devis_items WHERE devis_id = ?",
                [devisId],
                (err, devisItems) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  if (devisItems && devisItems.length > 0) {
                    const stmt = db.prepare(
                      "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)"
                    );

                    devisItems.forEach((item) => {
                      stmt.run([invoiceId, item.description, item.quantity, item.unit_price, item.total_price]);
                    });

                    stmt.finalize();
                  }

                  // Update devis status to converted
                  db.run("UPDATE devis SET status = 'converti' WHERE id = ?", [devisId]);

                  // Emit QuotationConverted and InvoiceCreated events
                  eventBus.emit("QuotationConverted", { devisId: devisId, invoiceId: invoiceId }, db);
                  eventBus.emit("InvoiceCreated", { invoiceId: invoiceId, projectId: devis.project_id }, db);

                  res.json({
                    success: true,
                    id: invoiceId,
                    invoice_number: invoiceNumber,
                    message: "Invoice created from quotation successfully"
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// =======================================
// UPDATE INVOICE
// =======================================
router.put("/:id", (req, res) => {
  const {
    client_id,
    project_id,
    amount,
    status,
    invoice_date,
    vat_amount,
    discount,
    notes,
    items
  } = req.body;
  const invoiceId = req.params.id;

  // Calculate totals
  const totalAmount = Number(amount) || 0;
  const vat = Number(vat_amount) || 0;
  const discountAmount = Number(discount) || 0;
  const finalAmount = totalAmount + vat - discountAmount;

  db.get("SELECT status, project_id FROM invoices WHERE id = ?", [invoiceId], (err, invoice) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Prevent editing of paid or cancelled invoices
    if (invoice.status === "Paid" || invoice.status === "Cancelled") {
      return res.status(400).json({ error: "Cannot edit a paid or cancelled invoice" });
    }

    db.run(
      `
      UPDATE invoices SET
        client_id = ?,
        project_id = ?,
        amount = ?,
        vat_amount = ?,
        discount = ?,
        status = ?,
        invoice_date = ?,
        notes = ?,
        updated_at = datetime('now')
      WHERE id = ?
      `,
      [
        client_id,
        project_id || null,
        finalAmount,
        vat,
        discountAmount,
        status || invoice.status,
        invoice_date,
        notes || "",
        invoiceId
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Update items if provided
        if (items && Array.isArray(items)) {
          db.run("DELETE FROM invoice_items WHERE invoice_id = ?", [invoiceId], (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            if (items.length > 0) {
              const stmt = db.prepare(
                "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)"
              );

              items.forEach((item) => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.unit_price) || 0;
                const total = qty * price;
                stmt.run([invoiceId, item.description, qty, price, total]);
              });

              stmt.finalize();
            }
          });
        }

        // Emit InvoiceUpdated event
        if (status) {
          eventBus.emit("InvoiceUpdated", {
            invoiceId: invoiceId,
            projectId: project_id || invoice.project_id,
            status: status
          }, db);

          // Check if invoice is paid
          if (status === "Paid") {
            eventBus.emit("InvoicePaid", { invoiceId: invoiceId }, db);
          }
        }

        res.json({
          success: true,
          message: "Invoice updated successfully"
        });
      }
    );
  });
});

// =======================================
// DELETE INVOICE
// =======================================
router.delete("/:id", (req, res) => {
  const invoiceId = req.params.id;

  db.get("SELECT status FROM invoices WHERE id = ?", [invoiceId], (err, invoice) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Only allow deleting draft invoices
    if (invoice.status !== "Draft") {
      return res.status(400).json({ error: "Only draft invoices can be deleted" });
    }

    db.run("DELETE FROM invoices WHERE id = ?", [invoiceId], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        message: "Invoice deleted successfully"
      });
    });
  });
});

// =======================================
// UPDATE INVOICE STATUS
// =======================================
router.put("/:id/status", (req, res) => {
  const { status } = req.body;
  const invoiceId = req.params.id;
  const validStatuses = ["Draft", "Issued", "Partially Paid", "Paid", "Cancelled"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.get("SELECT status, project_id FROM invoices WHERE id = ?", [invoiceId], (err, invoice) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Validate status transitions
    const transitions = {
      Draft: ["Issued", "Cancelled"],
      Issued: ["Partially Paid", "Paid", "Cancelled"],
      "Partially Paid": ["Paid", "Cancelled"],
      Paid: [],
      Cancelled: []
    };

    if (!transitions[invoice.status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot change status from '${invoice.status}' to '${status}'`,
        allowedTransitions: transitions[invoice.status] || []
      });
    }

    db.run(
      "UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, invoiceId],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Emit events
        if (status === "Paid") {
          eventBus.emit("InvoicePaid", { invoiceId: invoiceId }, db);
        }

        res.json({
          success: true,
          message: `Invoice status changed to '${status}'`
        });
      }
    );
  });
});

module.exports = router;