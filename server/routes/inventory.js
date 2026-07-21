const express = require("express");
const router = express.Router();
const db = require("../database");
const {
  reserveMaterial,
  reserveProjectMaterials,
  checkMaterialAvailability,
  releaseReservation,
  getProjectReservations,
  consumeMaterial,
  consumeProjectMaterials,
  calculateMaterialDifference,
  calculateMaterialLoss,
  checkLowStock,
  checkProjectMaterialShortage,
  generateStockAlerts,
  getInventoryValue,
  getMaterialUsageReport,
  getStockMovementReport,
  getProjectConsumptionReport,
} = require("../services/inventory");

// Reserve material
router.post("/reserve", async (req, res) => {
  try {
    const { project_id, product_id, quantity } = req.body;
    
    // Validate required fields
    if (!project_id) {
      return res.status(400).json({ error: "Project ID is required" });
    }
    if (!product_id) {
      return res.status(400).json({ error: "Product ID is required" });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Valid quantity is required" });
    }
    
    // Validate project exists
    const project = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM projects WHERE id = ?", [project_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!project) {
      return res.status(400).json({ error: "Project not found" });
    }
    
    // Validate product exists
    const product = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM products WHERE id = ?", [product_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!product) {
      return res.status(400).json({ error: "Product not found" });
    }
    
    const result = await reserveMaterial(project_id, product_id, quantity);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reserve project materials
router.post("/reserve-project", async (req, res) => {
  try {
    const { project_id, materials } = req.body;
    const result = await reserveProjectMaterials(project_id, materials);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Consume material
router.post("/consume", async (req, res) => {
  try {
    const { project_id, product_id, quantity } = req.body;
    
    // Validate required fields
    if (!project_id) {
      return res.status(400).json({ error: "Project ID is required" });
    }
    if (!product_id) {
      return res.status(400).json({ error: "Product ID is required" });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Valid quantity is required" });
    }
    
    // Validate project exists
    const project = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM projects WHERE id = ?", [project_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!project) {
      return res.status(400).json({ error: "Project not found" });
    }
    
    // Validate product exists
    const product = await new Promise((resolve, reject) => {
      db.get("SELECT id, quantity FROM products WHERE id = ?", [product_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!product) {
      return res.status(400).json({ error: "Product not found" });
    }
    
    // Check available stock
    if (product.quantity < quantity) {
      return res.status(400).json({ error: "Insufficient stock available" });
    }
    
    const result = await consumeMaterial(project_id, product_id, quantity);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Consume project materials
router.post("/consume-project/:id", async (req, res) => {
  try {
    const projectId = req.params.id;
    const result = await consumeProjectMaterials(projectId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project inventory
router.get("/project/:id", async (req, res) => {
  try {
    const projectId = req.params.id;
    const reservations = await getProjectReservations(projectId);
    const consumption = await getProjectConsumptionReport(projectId);
    const difference = await calculateMaterialDifference(projectId);
    const loss = await calculateMaterialLoss(projectId);

    res.json({
      reservations,
      consumption,
      difference,
      loss,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock alerts
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await checkLowStock();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory value
router.get("/value", async (req, res) => {
  try {
    const value = await getInventoryValue();
    res.json(value);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get material usage report
router.get("/material-usage", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await getMaterialUsageReport(startDate, endDate);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// WAREHOUSES
// =======================

router.get("/warehouses", (req, res) => {
  const { search = "", page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = "SELECT * FROM warehouses WHERE 1=1";
  const params = [];

  if (search && search.trim() !== "") {
    sql += " AND (name LIKE ? OR code LIKE ?)";
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam);
  }

  sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/warehouses", (req, res) => {
  const { code, name, address, manager, phone, email, capacity, status, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Warehouse name is required" });
  }

  db.run(
    `INSERT INTO warehouses (code, name, address, manager, phone, email, capacity, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, name, address, manager, phone, email, capacity || 0, status || 'active', notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Warehouse created" });
    }
  );
});

router.put("/warehouses/:id", (req, res) => {
  const { code, name, address, manager, phone, email, capacity, status, notes } = req.body;

  const updates = [];
  const values = [];

  if (code !== undefined) { updates.push("code = ?"); values.push(code); }
  if (name !== undefined) { updates.push("name = ?"); values.push(name); }
  if (address !== undefined) { updates.push("address = ?"); values.push(address); }
  if (manager !== undefined) { updates.push("manager = ?"); values.push(manager); }
  if (phone !== undefined) { updates.push("phone = ?"); values.push(phone); }
  if (email !== undefined) { updates.push("email = ?"); values.push(email); }
  if (capacity !== undefined) { updates.push("capacity = ?"); values.push(capacity); }
  if (status !== undefined) { updates.push("status = ?"); values.push(status); }
  if (notes !== undefined) { updates.push("notes = ?"); values.push(notes); }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  values.push(req.params.id);

  db.run(`UPDATE warehouses SET ${updates.join(", ")} WHERE id = ?`, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Warehouse updated" });
  });
});

router.delete("/warehouses/:id", (req, res) => {
  db.run("DELETE FROM warehouses WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Warehouse deleted" });
  });
});

// =======================
// WAREHOUSE LOCATIONS
// =======================

router.get("/warehouses/:id/locations", (req, res) => {
  db.all(
    "SELECT * FROM warehouse_locations WHERE warehouse_id = ? ORDER BY id DESC",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

router.post("/warehouses/:id/locations", (req, res) => {
  const { code, name, aisle, shelf, bin, capacity } = req.body;

  db.run(
    `INSERT INTO warehouse_locations (warehouse_id, code, name, aisle, shelf, bin, capacity)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, code, name, aisle, shelf, bin, capacity || 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Location created" });
    }
  );
});

// =======================
// STOCK TRANSFERS
// =======================

router.get("/transfers", (req, res) => {
  const { product_id, from_warehouse_id, to_warehouse_id, status } = req.query;
  let sql = `SELECT st.*, p.name as product_name, w1.name as from_warehouse, w2.name as to_warehouse 
             FROM stock_transfers st 
             LEFT JOIN products p ON st.product_id = p.id 
             LEFT JOIN warehouses w1 ON st.from_warehouse_id = w1.id 
             LEFT JOIN warehouses w2 ON st.to_warehouse_id = w2.id 
             WHERE 1=1`;
  const params = [];

  if (product_id) {
    sql += " AND st.product_id = ?";
    params.push(product_id);
  }
  if (from_warehouse_id) {
    sql += " AND st.from_warehouse_id = ?";
    params.push(from_warehouse_id);
  }
  if (to_warehouse_id) {
    sql += " AND st.to_warehouse_id = ?";
    params.push(to_warehouse_id);
  }
  if (status) {
    sql += " AND st.status = ?";
    params.push(status);
  }

  sql += " ORDER BY st.id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/transfers", async (req, res) => {
  const { product_id, from_warehouse_id, to_warehouse_id, quantity, unit, transfer_date, status, notes } = req.body;

  // Validate required fields
  if (!product_id) {
    return res.status(400).json({ error: "Product ID is required" });
  }
  if (!from_warehouse_id) {
    return res.status(400).json({ error: "Source warehouse ID is required" });
  }
  if (!to_warehouse_id) {
    return res.status(400).json({ error: "Destination warehouse ID is required" });
  }
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: "Valid quantity is required" });
  }

  // Validate product exists
  const product = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM products WHERE id = ?", [product_id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  if (!product) {
    return res.status(400).json({ error: "Product not found" });
  }

  // Validate source warehouse exists
  const fromWarehouse = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM warehouses WHERE id = ?", [from_warehouse_id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  if (!fromWarehouse) {
    return res.status(400).json({ error: "Source warehouse not found" });
  }

  // Validate destination warehouse exists
  const toWarehouse = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM warehouses WHERE id = ?", [to_warehouse_id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  if (!toWarehouse) {
    return res.status(400).json({ error: "Destination warehouse not found" });
  }

  // Prevent source warehouse = destination warehouse
  if (from_warehouse_id === to_warehouse_id) {
    return res.status(400).json({ error: "Source and destination warehouses cannot be the same" });
  }

  db.run(
    `INSERT INTO stock_transfers (product_id, from_warehouse_id, to_warehouse_id, quantity, unit, transfer_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [product_id, from_warehouse_id, to_warehouse_id, quantity || 0, unit || 'kg', transfer_date, status || 'pending', notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Transfer created" });
    }
  );
});

// =======================
// STOCK ADJUSTMENTS
// =======================

router.get("/adjustments", (req, res) => {
  const { product_id, warehouse_id } = req.query;
  let sql = `SELECT sa.*, p.name as product_name, w.name as warehouse_name 
             FROM stock_adjustments sa 
             LEFT JOIN products p ON sa.product_id = p.id 
             LEFT JOIN warehouses w ON sa.warehouse_id = w.id 
             WHERE 1=1`;
  const params = [];

  if (product_id) {
    sql += " AND sa.product_id = ?";
    params.push(product_id);
  }
  if (warehouse_id) {
    sql += " AND sa.warehouse_id = ?";
    params.push(warehouse_id);
  }

  sql += " ORDER BY sa.id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/adjustments", async (req, res) => {
  const { product_id, warehouse_id, location_id, quantity_change, reason, notes } = req.body;

  // Validate required fields
  if (!product_id) {
    return res.status(400).json({ error: "Product ID is required" });
  }
  if (!warehouse_id) {
    return res.status(400).json({ error: "Warehouse ID is required" });
  }

  // Validate product exists
  const product = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM products WHERE id = ?", [product_id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  if (!product) {
    return res.status(400).json({ error: "Product not found" });
  }

  // Validate warehouse exists
  const warehouse = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM warehouses WHERE id = ?", [warehouse_id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  if (!warehouse) {
    return res.status(400).json({ error: "Warehouse not found" });
  }

  db.run(
    `INSERT INTO stock_adjustments (product_id, warehouse_id, location_id, quantity_change, reason, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [product_id, warehouse_id, location_id, quantity_change || 0, reason, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Adjustment created" });
    }
  );
});

// =======================
// INVENTORY BATCHES
// =======================

router.get("/batches", (req, res) => {
  const { product_id } = req.query;
  let sql = `SELECT ib.*, p.name as product_name FROM inventory_batches ib LEFT JOIN products p ON ib.product_id = p.id WHERE 1=1`;
  const params = [];

  if (product_id) {
    sql += " AND ib.product_id = ?";
    params.push(product_id);
  }

  sql += " ORDER BY ib.id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/batches", async (req, res) => {
  const { product_id, batch_number, quantity, unit, expiry_date, purchase_price } = req.body;

  // Validate required fields
  if (!product_id) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  // Validate product exists
  const product = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM products WHERE id = ?", [product_id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  if (!product) {
    return res.status(400).json({ error: "Product not found" });
  }

  db.run(
    `INSERT INTO inventory_batches (product_id, batch_number, quantity, unit, expiry_date, purchase_price)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [product_id, batch_number, quantity || 0, unit || 'kg', expiry_date, purchase_price || 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Batch created" });
    }
  );
});

// =======================
// INVENTORY SERIALS
// =======================

router.get("/serials", (req, res) => {
  const { product_id, status } = req.query;
  let sql = `SELECT ins.*, p.name as product_name FROM inventory_serials ins LEFT JOIN products p ON ins.product_id = p.id WHERE 1=1`;
  const params = [];

  if (product_id) {
    sql += " AND ins.product_id = ?";
    params.push(product_id);
  }
  if (status) {
    sql += " AND ins.status = ?";
    params.push(status);
  }

  sql += " ORDER BY ins.id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/serials", async (req, res) => {
  const { product_id, serial_number, status, notes } = req.body;

  // Validate required fields
  if (!product_id) {
    return res.status(400).json({ error: "Product ID is required" });
  }
  if (!serial_number) {
    return res.status(400).json({ error: "Serial number is required" });
  }

  // Validate product exists
  const product = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM products WHERE id = ?", [product_id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  if (!product) {
    return res.status(400).json({ error: "Product not found" });
  }

  db.run(
    `INSERT INTO inventory_serials (product_id, serial_number, status, notes)
     VALUES (?, ?, ?, ?)`,
    [product_id, serial_number, status || 'available', notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Serial created" });
    }
  );
});

// =======================
// INVENTORY DASHBOARD
// =======================

router.get("/dashboard", (req, res) => {
  const queries = {
    totalProducts: "SELECT COUNT(*) as count FROM products",
    totalStock: "SELECT COALESCE(SUM(quantity), 0) as total FROM products",
    lowStock: "SELECT COUNT(*) as count FROM products WHERE quantity < minimum_quantity OR minimum_quantity = 0",
    totalWarehouses: "SELECT COUNT(*) as count FROM warehouses",
    totalBatches: "SELECT COUNT(*) as count FROM inventory_batches",
    expiredBatches: "SELECT COUNT(*) as count FROM inventory_batches WHERE expiry_date IS NOT NULL AND date(expiry_date) < date('now')",
    nearExpiry: "SELECT COUNT(*) as count FROM inventory_batches WHERE expiry_date IS NOT NULL AND date(expiry_date) BETWEEN date('now') AND date('now', '+30 days')",
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

// =======================
// LOW STOCK
// =======================

router.get("/low-stock", (req, res) => {
  db.all(
    "SELECT * FROM products WHERE quantity < minimum_quantity OR minimum_quantity = 0 ORDER BY quantity ASC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// =======================
// EXPIRED PRODUCTS
// =======================

router.get("/expired", (req, res) => {
  db.all(
    `SELECT ib.*, p.name as product_name FROM inventory_batches ib 
     LEFT JOIN products p ON ib.product_id = p.id 
     WHERE ib.expiry_date IS NOT NULL AND date(ib.expiry_date) < date('now') 
     ORDER BY ib.expiry_date ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// =======================
// INVENTORY VALUATION
// =======================

router.get("/valuation", (req, res) => {
  db.all(
    `SELECT p.*, (p.quantity * p.average_cost) as inventory_value 
     FROM products p 
     ORDER BY inventory_value DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const totalValue = rows.reduce((sum, r) => sum + (r.inventory_value || 0), 0);
      res.json({
        items: rows,
        totalValue: totalValue
      });
    }
  );
});

module.exports = router;
