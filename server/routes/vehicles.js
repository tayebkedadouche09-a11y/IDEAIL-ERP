const express = require("express");
const router = express.Router();
const db = require("../database");
const { eventBus } = require("../services/events");

// =======================================
// VEHICLE CRUD
// =======================================

// Get all vehicles with search and pagination
router.get("/", (req, res) => {
  const { search = "", page = 1, limit = 20, status: statusFilter, type: typeFilter } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT v.*, e.name as driver_name, p.name as project_name 
    FROM vehicles v 
    LEFT JOIN employees e ON v.driver_id = e.id 
    LEFT JOIN projects p ON v.project_id = p.id 
    WHERE 1=1
  `;
  let countQuery = `SELECT COUNT(*) as total FROM vehicles WHERE 1=1`;
  const params = [];
  const countParams = [];

  if (search && search.trim() !== "") {
    query += " AND (registration_number LIKE ? OR brand LIKE ? OR model LIKE ?)";
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
    countParams.push(searchParam, searchParam, searchParam);
  }

  if (statusFilter && statusFilter !== "all") {
    query += " AND v.status = ?";
    params.push(statusFilter);
    countParams.push(statusFilter);
  }

  if (typeFilter && typeFilter !== "all") {
    query += " AND v.type = ?";
    params.push(typeFilter);
    countParams.push(typeFilter);
  }

  query += " ORDER BY v.id DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  db.get(countQuery, countParams, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(query, params, (err, rows) => {
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

// Create vehicle
router.post("/", (req, res) => {
  const {
    registration_number, internal_code, brand, model, year, type, fuel_type, vin, color,
    purchase_date, purchase_price, insurance, technical_inspection, current_mileage,
    status, notes, photo, driver_id, department, project_id, insurance_cost, fuel_budget,
    last_service_date, next_service_date
  } = req.body;

  if (!registration_number) {
    return res.status(400).json({ error: "Registration number is required" });
  }

  db.run(
    `INSERT INTO vehicles 
     (registration_number, internal_code, brand, model, year, type, fuel_type, vin, color,
      purchase_date, purchase_price, insurance, technical_inspection, current_mileage,
      status, notes, photo, driver_id, department, project_id, insurance_cost, fuel_budget,
      last_service_date, next_service_date) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      registration_number, internal_code, brand, model, year, type || 'truck', fuel_type, vin, color,
      purchase_date, purchase_price || 0, insurance, technical_inspection, current_mileage || 0,
      status || 'available', notes, photo, driver_id, department, project_id, insurance_cost || 0, fuel_budget || 0,
      last_service_date, next_service_date
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Vehicle created" });
    }
  );
});

// Update vehicle
router.put("/:id", (req, res) => {
  const {
    registration_number, internal_code, brand, model, year, type, fuel_type, vin, color,
    purchase_date, purchase_price, insurance, technical_inspection, current_mileage,
    status, notes, photo, driver_id, department, project_id, insurance_cost, fuel_budget,
    last_service_date, next_service_date
  } = req.body;

  // Build dynamic update query
  const updates = [];
  const values = [];
  
  if (registration_number !== undefined) { updates.push("registration_number = ?"); values.push(registration_number); }
  if (internal_code !== undefined) { updates.push("internal_code = ?"); values.push(internal_code); }
  if (brand !== undefined) { updates.push("brand = ?"); values.push(brand); }
  if (model !== undefined) { updates.push("model = ?"); values.push(model); }
  if (year !== undefined) { updates.push("year = ?"); values.push(year); }
  if (type !== undefined) { updates.push("type = ?"); values.push(type); }
  if (fuel_type !== undefined) { updates.push("fuel_type = ?"); values.push(fuel_type); }
  if (vin !== undefined) { updates.push("vin = ?"); values.push(vin); }
  if (color !== undefined) { updates.push("color = ?"); values.push(color); }
  if (purchase_date !== undefined) { updates.push("purchase_date = ?"); values.push(purchase_date); }
  if (purchase_price !== undefined) { updates.push("purchase_price = ?"); values.push(purchase_price); }
  if (insurance !== undefined) { updates.push("insurance = ?"); values.push(insurance); }
  if (technical_inspection !== undefined) { updates.push("technical_inspection = ?"); values.push(technical_inspection); }
  if (current_mileage !== undefined) { updates.push("current_mileage = ?"); values.push(current_mileage); }
  if (status !== undefined) { updates.push("status = ?"); values.push(status); }
  if (notes !== undefined) { updates.push("notes = ?"); values.push(notes); }
  if (photo !== undefined) { updates.push("photo = ?"); values.push(photo); }
  if (driver_id !== undefined) { updates.push("driver_id = ?"); values.push(driver_id); }
  if (department !== undefined) { updates.push("department = ?"); values.push(department); }
  if (project_id !== undefined) { updates.push("project_id = ?"); values.push(project_id); }
  if (insurance_cost !== undefined) { updates.push("insurance_cost = ?"); values.push(insurance_cost); }
  if (fuel_budget !== undefined) { updates.push("fuel_budget = ?"); values.push(fuel_budget); }
  if (last_service_date !== undefined) { updates.push("last_service_date = ?"); values.push(last_service_date); }
  if (next_service_date !== undefined) { updates.push("next_service_date = ?"); values.push(next_service_date); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }
  
  values.push(req.params.id);
  
  db.run(
    `UPDATE vehicles SET ${updates.join(", ")} WHERE id = ?`,
    values,
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Vehicle updated" });
    }
  );
});

// Delete vehicle
router.delete("/:id", (req, res) => {
  db.run("DELETE FROM vehicles WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Vehicle deleted" });
  });
});

// =======================================
// VEHICLE STATS
// =======================================

router.get("/stats", (req, res) => {
  const queries = {
    total: "SELECT COUNT(*) as count FROM vehicles",
    active: "SELECT COUNT(*) as count FROM vehicles WHERE status = 'available'",
    maintenance: "SELECT COUNT(*) as count FROM vehicles WHERE status = 'maintenance'",
    fuelCost: "SELECT SUM(fuel_cost) as total FROM vehicle_fuel WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')",
    repairCost: "SELECT SUM(cost) as total FROM vehicle_repairs WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')",
    upcomingInspection: "SELECT COUNT(*) as count FROM vehicles WHERE technical_inspection IS NOT NULL AND date(technical_inspection) <= date('now', '+30 days')",
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
// FUEL MANAGEMENT
// =======================================

router.get("/fuel", (req, res) => {
  const { vehicle_id, start_date, end_date } = req.query;

  let query = `
    SELECT f.*, v.registration_number, e.name as driver_name
    FROM vehicle_fuel f
    LEFT JOIN vehicles v ON f.vehicle_id = v.id
    LEFT JOIN employees e ON f.driver_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (vehicle_id) {
    query += " AND f.vehicle_id = ?";
    params.push(vehicle_id);
  }
  if (start_date) {
    query += " AND f.date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    query += " AND f.date <= ?";
    params.push(end_date);
  }

  query += " ORDER BY f.date DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/fuel", (req, res) => {
  const {
    vehicle_id, driver_id, date, fuel_type, quantity, unit_price, mileage,
    station, invoice_number, notes
  } = req.body;

  const fuel_cost = (quantity || 0) * (unit_price || 0);

  db.run(
    `INSERT INTO vehicle_fuel 
     (vehicle_id, driver_id, date, fuel_type, quantity, unit_price, fuel_cost, mileage, station, invoice_number, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [vehicle_id, driver_id, date, fuel_type, quantity, unit_price, fuel_cost, mileage, station, invoice_number, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, fuel_cost, message: "Fuel record added" });
    }
  );
});

// =======================================
// MAINTENANCE
// =======================================

router.get("/maintenance", (req, res) => {
  const { vehicle_id } = req.query;

  let query = `
    SELECT m.*, v.registration_number
    FROM vehicle_maintenance m
    LEFT JOIN vehicles v ON m.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];

  if (vehicle_id) {
    query += " AND m.vehicle_id = ?";
    params.push(vehicle_id);
  }

  query += " ORDER BY m.date DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/maintenance", (req, res) => {
  const {
    vehicle_id, date, type, garage, cost, mileage, next_maintenance, invoice, notes
  } = req.body;

  db.run(
    `INSERT INTO vehicle_maintenance 
     (vehicle_id, date, type, garage, cost, mileage, next_maintenance, invoice, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [vehicle_id, date, type, garage, cost || 0, mileage, next_maintenance, invoice, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Maintenance record added" });
    }
  );
});

// =======================================
// REPAIRS
// =======================================

router.get("/repairs", (req, res) => {
  const { vehicle_id } = req.query;

  let query = `
    SELECT r.*, v.registration_number
    FROM vehicle_repairs r
    LEFT JOIN vehicles v ON r.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];

  if (vehicle_id) {
    query += " AND r.vehicle_id = ?";
    params.push(vehicle_id);
  }

  query += " ORDER BY r.date DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/repairs", (req, res) => {
  const {
    vehicle_id, date, description, parts, labor, cost, garage, status, notes
  } = req.body;

  db.run(
    `INSERT INTO vehicle_repairs 
     (vehicle_id, date, description, parts, labor, cost, garage, status, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [vehicle_id, date, description, parts, labor || 0, cost || 0, garage, status || 'pending', notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Repair record added" });
    }
  );
});

// =======================================
// INSURANCE
// =======================================

router.get("/insurance", (req, res) => {
  const { vehicle_id } = req.query;

  let query = `
    SELECT i.*, v.registration_number
    FROM vehicle_insurance i
    LEFT JOIN vehicles v ON i.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];

  if (vehicle_id) {
    query += " AND i.vehicle_id = ?";
    params.push(vehicle_id);
  }

  query += " ORDER BY i.start_date DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/insurance", (req, res) => {
  const {
    vehicle_id, company, policy_number, start_date, end_date, premium, notes
  } = req.body;

  db.run(
    `INSERT INTO vehicle_insurance 
     (vehicle_id, company, policy_number, start_date, end_date, premium, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [vehicle_id, company, policy_number, start_date, end_date, premium || 0, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Insurance record added" });
    }
  );
});

// =======================================
// DOCUMENTS
// =======================================

router.get("/:id/documents", (req, res) => {
  db.all(
    "SELECT * FROM vehicle_documents WHERE vehicle_id = ? ORDER BY created_at DESC",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

router.post("/:id/documents", (req, res) => {
  const { document_name, document_type, file_path, notes } = req.body;

  db.run(
    `INSERT INTO vehicle_documents 
     (vehicle_id, document_name, document_type, file_path, notes) 
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.id, document_name, document_type, file_path, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Document added" });
    }
  );
});

module.exports = router;