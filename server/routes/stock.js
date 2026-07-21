const express = require("express");
const router = express.Router();
const db = require("../database");
const { checkStockAvailability, updateProductQuantity } = require("../middleware/stockMiddleware");

// =======================================
// GET /stock - Stock balance (root endpoint)
// =======================================
router.get("/", (req, res) => {
  db.all(
    `
    SELECT
      p.id,
      p.name,
      p.category,
      p.unit,
      p.quantity,
      p.minimum_quantity,
      p.purchase_price,
      p.sale_price,
      CASE
        WHEN p.quantity < p.minimum_quantity * 0.5 THEN 'critical'
        WHEN p.quantity < p.minimum_quantity THEN 'warning'
        ELSE 'ok'
      END AS stock_status
    FROM products p
    ORDER BY p.name ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// =======================================
// GET /stock/movements - List all movements with search and pagination
// =======================================
router.get("/movements", (req, res) => {
  const { search = "", page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      sm.*,
      p.name AS product_name,
      p.unit AS product_unit
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
  `;

  let params = [];
  let countParams = [];

  // Add search filter
  if (search && search.trim() !== "") {
    query += ` WHERE p.name LIKE ? OR sm.notes LIKE ?`;
    const searchParam = `%${search}%`;
    params = [searchParam, searchParam];
    countParams = [searchParam, searchParam];
  }

  query += ` ORDER BY sm.id DESC LIMIT ? OFFSET ?`;
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
// GET /stock/balance - Current stock for all products
// =======================================
router.get("/balance", (req, res) => {
  db.all(
    `
    SELECT
      p.id,
      p.name,
      p.category,
      p.unit,
      p.quantity,
      p.minimum_quantity,
      p.purchase_price,
      p.sale_price,
      CASE
        WHEN p.quantity < p.minimum_quantity * 0.5 THEN 'critical'
        WHEN p.quantity < p.minimum_quantity THEN 'warning'
        ELSE 'ok'
      END AS stock_status
    FROM products p
    ORDER BY p.name ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// =======================================
// GET /stock/alerts - Low stock products
// =======================================
router.get("/alerts", (req, res) => {
  db.all(
    `
    SELECT
      p.id,
      p.name,
      p.category,
      p.quantity,
      p.minimum_quantity,
      p.unit,
      (p.quantity * 1.0 / p.minimum_quantity) AS ratio
    FROM products p
    WHERE p.minimum_quantity > 0 AND p.quantity < p.minimum_quantity
    ORDER BY ratio ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const alerts = rows.map((p) => ({
        ...p,
        severity:
          p.quantity < p.minimum_quantity * 0.5
            ? "critical"
            : p.quantity < p.minimum_quantity
            ? "warning"
            : "info",
      }));

      res.json(alerts);
    }
  );
});

// =======================================
// GET /stock/valuation - Stock value
// =======================================
router.get("/valuation", (req, res) => {
  db.all(
    `
    SELECT
      p.id,
      p.name,
      p.category,
      p.quantity,
      p.purchase_price,
      (p.quantity * p.purchase_price) AS total_value
    FROM products p
    WHERE p.quantity > 0
    ORDER BY total_value DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const totalValue = rows.reduce((sum, p) => sum + (p.total_value || 0), 0);

      res.json({
        items: rows,
        totalValue,
        itemCount: rows.length,
      });
    }
  );
});

// =======================================
// GET /stock/history/:productId - Movement history for one product
// =======================================
router.get("/history/:productId", (req, res) => {
  const productId = req.params.productId;

  db.all(
    `
    SELECT sm.*, p.name AS product_name
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    WHERE sm.product_id = ?
    ORDER BY sm.id DESC
    LIMIT 50
    `,
    [productId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// =======================================
// POST /stock/movements - Add movement (with auto-update)
// =======================================
router.post("/movements", checkStockAvailability, (req, res) => {
  const { product_id, movement_type, quantity, notes } = req.body;

  if (!product_id || !movement_type || !quantity) {
    return res.status(400).json({ error: "Product, movement type, and quantity are required" });
  }

  db.run(
    `INSERT INTO stock_movements (product_id, movement_type, quantity, notes)
     VALUES (?, ?, ?, ?)`,
    [product_id, movement_type, quantity, notes || ""],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Auto-update product quantity
      updateProductQuantity(product_id, quantity, movement_type);

      res.json({
        success: true,
        id: this.lastID,
        message: "Stock movement recorded",
      });
    }
  );
});

// =======================================
// PUT /stock/movements/:id - Update movement
// =======================================
router.put("/movements/:id", (req, res) => {
  const { product_id, movement_type, quantity, notes } = req.body;
  const movementId = req.params.id;

  // Get existing movement to reverse its effect
  db.get("SELECT * FROM stock_movements WHERE id = ?", [movementId], (err, movement) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!movement) return res.status(404).json({ error: "Movement not found" });

    // Reverse old movement
    const oldChange = movement.movement_type === "Entrée" || movement.movement_type === "entree"
      ? -movement.quantity
      : movement.quantity;
    db.run(
      "UPDATE products SET quantity = quantity + ? WHERE id = ?",
      [oldChange, movement.product_id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Update movement
        db.run(
          `UPDATE stock_movements SET product_id=?, movement_type=?, quantity=?, notes=? WHERE id=?`,
          [product_id, movement_type, quantity, notes || "", movementId],
          function (err) {
            if (err) {
              // Re-apply old movement if update fails
              db.run("UPDATE products SET quantity = quantity + ? WHERE id = ?", [-oldChange, movement.product_id]);
              return res.status(500).json({ error: err.message });
            }

            // Apply new movement
            const newChange = movement_type === "Entrée" || movement_type === "entree" ? quantity : -quantity;
            db.run(
              "UPDATE products SET quantity = quantity + ? WHERE id = ?",
              [newChange, product_id],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, message: "Movement updated" });
              }
            );
          }
        );
      }
    );
  });
});

// =======================================
// DELETE /stock/movements/:id - Delete movement (reverse effect)
// =======================================
router.delete("/movements/:id", (req, res) => {
  const movementId = req.params.id;

  db.get("SELECT * FROM stock_movements WHERE id = ?", [movementId], (err, movement) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!movement) return res.status(404).json({ error: "Movement not found" });

    // Reverse the movement effect
    const change = movement.movement_type === "Entrée" || movement.movement_type === "entree"
      ? -movement.quantity
      : movement.quantity;

    db.run(
      "UPDATE products SET quantity = quantity + ? WHERE id = ?",
      [change, movement.product_id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Delete the movement
        db.run("DELETE FROM stock_movements WHERE id = ?", [movementId], function (err) {
          if (err) {
            // Revert product quantity if delete fails
            db.run("UPDATE products SET quantity = quantity + ? WHERE id = ?", [-change, movement.product_id]);
            return res.status(500).json({ error: err.message });
          }
          res.json({ success: true, message: "Movement deleted" });
        });
      }
    );
  });
});

// =======================================
// GET /stock/reservations - List all reservations
// =======================================
router.get("/reservations", (req, res) => {
  db.all(
    `
    SELECT
      pmr.*,
      p.name AS product_name,
      p.quantity AS current_quantity
    FROM project_material_reservations pmr
    LEFT JOIN products p ON pmr.product_id = p.id
    ORDER BY pmr.created_at DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// =======================================
// GET /stock/consumption - List all consumption records
// =======================================
router.get("/consumption", (req, res) => {
  db.all(
    `
    SELECT
      mc.*,
      p.name AS product_name
    FROM material_consumptions mc
    LEFT JOIN products p ON mc.product_id = p.id
    ORDER BY mc.created_at DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

module.exports = router;