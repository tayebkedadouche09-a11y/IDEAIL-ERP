const express = require("express");
const router = express.Router();

const db = require("../database");
const { eventBus } = require("../services/events");

// =======================================
// GET ALL PRODUCTS WITH SEARCH AND PAGINATION
// =======================================

router.get("/", (req, res) => {
  const { search = "", page = 1, limit = 20, category: categoryFilter, supplier: supplierFilter } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT products.*, suppliers.name AS supplier_name
    FROM products
    LEFT JOIN suppliers ON products.supplier = suppliers.id
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM products
    LEFT JOIN suppliers ON products.supplier = suppliers.id
  `;

  let params = [];
  let countParams = [];
  let whereConditions = [];

  // Add search filter
  if (search && search.trim() !== "") {
    whereConditions.push(`(products.name LIKE ? OR products.category LIKE ? OR suppliers.name LIKE ?)`);
    const searchParam = `%${search}%`;
    params = [searchParam, searchParam, searchParam];
    countParams = [searchParam, searchParam, searchParam];
  }

  // Add category filter
  if (categoryFilter && categoryFilter.trim() !== "" && categoryFilter !== "all") {
    whereConditions.push(`products.category = ?`);
    params.push(categoryFilter);
    countParams.push(categoryFilter);
  }

  // Add supplier filter
  if (supplierFilter && supplierFilter.trim() !== "" && supplierFilter !== "all") {
    whereConditions.push(`products.supplier = ?`);
    params.push(supplierFilter);
    countParams.push(supplierFilter);
  }

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(" AND ")}`;
    countQuery += ` WHERE ${whereConditions.join(" AND ")}`;
  }

  query += ` ORDER BY products.id DESC LIMIT ? OFFSET ?`;
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
// GET PRODUCT DETAILS
// =======================================

router.get("/:id", (req, res) => {
  db.get(
    `
    SELECT products.*, suppliers.name AS supplier_name
    FROM products
    LEFT JOIN suppliers ON products.supplier = suppliers.id
    WHERE products.id = ?
    `,
    [req.params.id],
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!product) {
        return res.status(404).json({ error: "المنتج غير موجود" });
      }

      res.json(product);
    }
  );
});

// =======================================
// CREATE PRODUCT
// =======================================

router.post("/", (req, res) => {
  const {
    name,
    category,
    unit,
    purchase_price,
    sale_price,
    quantity,
    minimum_quantity,
    supplier
  } = req.body;

  // Validation
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "اسم المنتج مطلوب" });
  }

  db.run(
    `
    INSERT INTO products
    (name, category, unit, purchase_price, sale_price, quantity, minimum_quantity, supplier)
    VALUES (?,?,?,?,?,?,?,?)
    `,
    [
      name,
      category,
      unit || "kg",
      purchase_price || 0,
      sale_price || 0,
      quantity || 0,
      minimum_quantity || 0,
      supplier || null
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Emit StockIn event for new product
      eventBus.emit("StockIn", {
        productId: this.lastID,
        quantity: quantity,
        type: "initial_stock"
      }, db);

      // Check if stock is low
      if (quantity && minimum_quantity && Number(quantity) <= Number(minimum_quantity)) {
        eventBus.emit("StockLow", {
          productId: this.lastID,
          quantity: quantity,
          minimum: minimum_quantity
        }, db);
      }

      res.json({
        success: true,
        id: this.lastID,
        message: "تمت إضافة المنتج بنجاح"
      });
    }
  );
});

// =======================================
// UPDATE PRODUCT
// =======================================

router.put("/:id", (req, res) => {
  const id = req.params.id;

  const {
    name,
    category,
    unit,
    purchase_price,
    sale_price,
    quantity,
    minimum_quantity,
    supplier
  } = req.body;

  // Validation
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "اسم المنتج مطلوب" });
  }

  db.run(
    `
    UPDATE products SET
    name = ?,
    category = ?,
    unit = ?,
    purchase_price = ?,
    sale_price = ?,
    quantity = ?,
    minimum_quantity = ?,
    supplier = ?
    WHERE id = ?
    `,
    [
      name,
      category,
      unit || "kg",
      purchase_price || 0,
      sale_price || 0,
      quantity || 0,
      minimum_quantity || 0,
      supplier || null,
      id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Emit StockAdjusted event
      if (quantity !== undefined) {
        eventBus.emit("StockAdjusted", {
          productId: id,
          quantity: quantity,
          type: "adjustment"
        }, db);

        // Check if stock is low
        if (minimum_quantity && Number(quantity) <= Number(minimum_quantity)) {
          eventBus.emit("StockLow", {
            productId: id,
            quantity: quantity,
            minimum: minimum_quantity
          }, db);
        }
      }

      res.json({
        success: true,
        message: "تم تعديل المنتج بنجاح"
      });
    }
  );
});

// =======================================
// DELETE PRODUCT
// =======================================

router.delete("/:id", (req, res) => {
  db.run(
    `
    DELETE FROM products
    WHERE id = ?
    `,
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        message: "تم حذف المنتج"
      });
    }
  );
});

// =======================================
// GET CATEGORIES
// =======================================

router.get("/categories", (req, res) => {
  db.all(
    `
    SELECT DISTINCT category
    FROM products
    WHERE category IS NOT NULL AND category != ''
    ORDER BY category
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows.map(r => r.category));
    }
  );
});

// =======================================
// STOCK ALERTS
// =======================================

router.get("/alerts/low-stock", (req, res) => {
  db.all(
    `
    SELECT products.*, suppliers.name AS supplier_name
    FROM products
    LEFT JOIN suppliers ON products.supplier = suppliers.id
    WHERE products.quantity <= products.minimum_quantity AND products.quantity > 0
    ORDER BY products.quantity ASC
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

router.get("/alerts/out-of-stock", (req, res) => {
  db.all(
    `
    SELECT products.*, suppliers.name AS supplier_name
    FROM products
    LEFT JOIN suppliers ON products.supplier = suppliers.id
    WHERE products.quantity = 0 OR products.quantity IS NULL
    ORDER BY products.name ASC
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