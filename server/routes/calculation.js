const express = require("express");
const router = express.Router();
const db = require("../database");
const {
  calculateMaterialRequirement,
  calculateSystemCost,
  calculateSellingPrice,
  calculateProfit,
  calculateMargin,
  calculateFullPricing,
} = require("../services/calculation");

// =======================================
// GET /calculations - List all calculations with search and pagination
// =======================================
router.get("/", (req, res) => {
  const { search = "", page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      c.*,
      s.name AS system_name,
      cl.name AS client_name,
      p.name AS project_name
    FROM calculations c
    LEFT JOIN systems s ON c.system_id = s.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN projects p ON c.project_id = p.id
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM calculations c
    LEFT JOIN systems s ON c.system_id = s.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN projects p ON c.project_id = p.id
  `;

  let params = [];
  let countParams = [];

  // Add search filter
  if (search && search.trim() !== "") {
    query += ` WHERE s.name LIKE ? OR cl.name LIKE ? OR p.name LIKE ?`;
    const searchParam = `%${search}%`;
    params = [searchParam, searchParam, searchParam];
    countParams = [searchParam, searchParam, searchParam];
  }

  query += ` ORDER BY c.id DESC LIMIT ? OFFSET ?`;
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
// GET /calculations/:id - Get single calculation
// =======================================
router.get("/:id", (req, res) => {
  const id = req.params.id;

  // Check if it's a numeric ID (calculation)
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  db.get(
    `
    SELECT
      c.*,
      s.name AS system_name,
      cl.name AS client_name,
      p.name AS project_name
    FROM calculations c
    LEFT JOIN systems s ON c.system_id = s.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN projects p ON c.project_id = p.id
    WHERE c.id = ?
    `,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(404).json({ error: "Calculation not found" });
      }

      res.json(row);
    }
  );
});

// =======================================
// POST /calculations - Create new calculation
// =======================================
router.post("/", (req, res) => {
  const {
    system_id,
    client_id,
    project_id,
    surface,
    thickness,
    labor_cost,
    transport,
    equipment,
    external_services,
    other_costs,
    margin,
    waste_percentage,
    vat_rate,
    total_cost,
    profit,
    selling_price,
    final_price,
    notes,
  } = req.body;

  // Validation
  if (!surface && !total_cost) {
    return res.status(400).json({ error: "Surface or total cost is required" });
  }

  db.run(
    `
    INSERT INTO calculations
    (
      system_id,
      client_id,
      project_id,
      surface,
      thickness,
      labor_cost,
      transport,
      equipment,
      external_services,
      other_costs,
      margin,
      waste_percentage,
      vat_rate,
      total_cost,
      profit,
      selling_price,
      final_price,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      system_id || null,
      client_id || null,
      project_id || null,
      Number(surface) || 0,
      Number(thickness) || 0,
      Number(labor_cost) || 0,
      Number(transport) || 0,
      Number(equipment) || 0,
      Number(external_services) || 0,
      Number(other_costs) || 0,
      Number(margin) || 30,
      Number(waste_percentage) || 5,
      Number(vat_rate) || 20,
      Number(total_cost) || 0,
      Number(profit) || 0,
      Number(selling_price) || 0,
      Number(final_price) || 0,
      notes || "",
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        id: this.lastID,
        message: "Calculation saved successfully",
      });
    }
  );
});

// =======================================
// PUT /calculations/:id - Update calculation
// =======================================
router.put("/:id", (req, res) => {
  const id = req.params.id;

  const {
    system_id,
    client_id,
    project_id,
    surface,
    thickness,
    labor_cost,
    transport,
    equipment,
    external_services,
    other_costs,
    margin,
    waste_percentage,
    vat_rate,
    total_cost,
    profit,
    selling_price,
    final_price,
    notes,
  } = req.body;

  // Validation
  if (!surface && !total_cost) {
    return res.status(400).json({ error: "Surface or total cost is required" });
  }

  db.run(
    `
    UPDATE calculations SET
      system_id = ?,
      client_id = ?,
      project_id = ?,
      surface = ?,
      thickness = ?,
      labor_cost = ?,
      transport = ?,
      equipment = ?,
      external_services = ?,
      other_costs = ?,
      margin = ?,
      waste_percentage = ?,
      vat_rate = ?,
      total_cost = ?,
      profit = ?,
      selling_price = ?,
      final_price = ?,
      notes = ?
    WHERE id = ?
    `,
    [
      system_id || null,
      client_id || null,
      project_id || null,
      Number(surface) || 0,
      Number(thickness) || 0,
      Number(labor_cost) || 0,
      Number(transport) || 0,
      Number(equipment) || 0,
      Number(external_services) || 0,
      Number(other_costs) || 0,
      Number(margin) || 30,
      Number(waste_percentage) || 5,
      Number(vat_rate) || 20,
      Number(total_cost) || 0,
      Number(profit) || 0,
      Number(selling_price) || 0,
      Number(final_price) || 0,
      notes || "",
      id,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Calculation not found" });
      }

      res.json({
        success: true,
        message: "Calculation updated successfully",
      });
    }
  );
});

// =======================================
// DELETE /calculations/:id - Delete calculation
// =======================================
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  db.run(
    "DELETE FROM calculations WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Calculation not found" });
      }

      res.json({
        success: true,
        message: "Calculation deleted successfully",
      });
    }
  );
});

// =======================================
// GET /calculation/system/:id/:surface - Calculate system materials
// =======================================
router.get("/system/:id/:surface", async (req, res) => {
  try {
    const systemId = req.params.id;
    const surface = req.params.surface;
    const wastePercentage = req.query.waste || 5;

    const result = await calculateSystemCost(systemId, surface, wastePercentage);

    res.json({
      systemName: result.system?.name || "Unknown",
      surface,
      materials: result.materials,
      totalCost: result.totalMaterialCost,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =======================================
// POST /calculation/calculate - Calculate with pricing
// =======================================
router.post("/calculate", async (req, res) => {
  try {
    const { systemId, surface, laborCost = 0, otherCosts = 0, margin = 30 } = req.body;

    const systemResult = await calculateSystemCost(systemId, surface);
    const pricing = calculateFullPricing(systemResult.materials, laborCost, otherCosts, margin);

    res.json({
      systemName: systemResult.system?.name || "Unknown",
      surface,
      materials: systemResult.materials,
      ...pricing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;