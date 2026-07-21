const express = require("express");
const router = express.Router();

const db = require("../database");

// =======================================
// GET /systems - List all systems with search and pagination
// =======================================
router.get("/", (req, res) => {
  const { search = "", page = 1, limit = 20, category: categoryFilter, sector: sectorFilter, status: statusFilter } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT *
    FROM systems
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM systems
  `;

  let params = [];
  let countParams = [];
  let whereConditions = [];

  // Add search filter
  if (search && search.trim() !== "") {
    whereConditions.push(`(name LIKE ? OR type LIKE ? OR description LIKE ?)`);
    const searchParam = `%${search}%`;
    params = [searchParam, searchParam, searchParam];
    countParams = [searchParam, searchParam, searchParam];
  }

  // Add category filter
  if (categoryFilter && categoryFilter.trim() !== "" && categoryFilter !== "all") {
    whereConditions.push(`category = ?`);
    params.push(categoryFilter);
    countParams.push(categoryFilter);
  }

  // Add sector filter
  if (sectorFilter && sectorFilter.trim() !== "" && sectorFilter !== "all") {
    whereConditions.push(`sector = ?`);
    params.push(sectorFilter);
    countParams.push(sectorFilter);
  }

  // Add status filter
  if (statusFilter && statusFilter.trim() !== "" && statusFilter !== "all") {
    whereConditions.push(`status = ?`);
    params.push(statusFilter);
    countParams.push(statusFilter);
  }

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(" AND ")}`;
    countQuery += ` WHERE ${whereConditions.join(" AND ")}`;
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
// GET /systems/categories - Get all categories
// =======================================
router.get("/categories", (req, res) => {
  db.all(
    `
    SELECT DISTINCT category
    FROM systems
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
// GET /systems/sectors - Get all sectors
// =======================================
router.get("/sectors", (req, res) => {
  db.all(
    `
    SELECT DISTINCT sector
    FROM systems
    WHERE sector IS NOT NULL AND sector != ''
    ORDER BY sector
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows.map(r => r.sector));
    }
  );
});

// =======================================
// GET /systems/:id - Get single system
// =======================================
router.get("/:id", (req, res) => {
  db.get(
    `
    SELECT *
    FROM systems
    WHERE id = ?
    `,
    [req.params.id],
    (err, system) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!system) {
        return res.status(404).json({ error: "النظام غير موجود" });
      }

      res.json(system);
    }
  );
});

// =======================================
// POST /systems - Create new system
// =======================================
router.post("/", (req, res) => {
  const {
    name,
    type,
    category,
    sector,
    description,
    components,
    layers,
    consumption,
    specifications,
    material_cost,
    labor_cost,
    other_costs,
    selling_price,
    status,
    notes
  } = req.body;

  // Validation
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "اسم النظام مطلوب" });
  }

  db.run(
    `
    INSERT INTO systems
    (
      name,
      type,
      category,
      sector,
      description,
      components,
      layers,
      consumption,
      specifications,
      material_cost,
      labor_cost,
      other_costs,
      selling_price,
      status,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      type,
      category,
      sector,
      description,
      components,
      layers,
      consumption,
      specifications,
      material_cost || 0,
      labor_cost || 0,
      other_costs || 0,
      selling_price || 0,
      status || 'active',
      notes
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        id: this.lastID,
        message: "تم إضافة النظام بنجاح"
      });
    }
  );
});

// =======================================
// PUT /systems/:id - Update system
// =======================================
router.put("/:id", (req, res) => {
  const id = req.params.id;

  const {
    name,
    type,
    category,
    sector,
    description,
    components,
    layers,
    consumption,
    specifications,
    material_cost,
    labor_cost,
    other_costs,
    selling_price,
    status,
    notes
  } = req.body;

  // Validation
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "اسم النظام مطلوب" });
  }

  db.run(
    `
    UPDATE systems SET
    name=?,
    type=?,
    category=?,
    sector=?,
    description=?,
    components=?,
    layers=?,
    consumption=?,
    specifications=?,
    material_cost=?,
    labor_cost=?,
    other_costs=?,
    selling_price=?,
    status=?,
    notes=?
    WHERE id=?
    `,
    [
      name,
      type,
      category,
      sector,
      description,
      components,
      layers,
      consumption,
      specifications,
      material_cost || 0,
      labor_cost || 0,
      other_costs || 0,
      selling_price || 0,
      status || 'active',
      notes,
      id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        message: "تم تعديل النظام"
      });
    }
  );
});

// =======================================
// DELETE /systems/:id - Delete system
// =======================================
router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM systems WHERE id=?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        message: "تم حذف النظام"
      });
    }
  );
});

// =======================================
// GET /systems/:id/components - Get system components
// =======================================
router.get("/:id/components", (req, res) => {
  const systemId = req.params.id;

  db.all(
    `
    SELECT *
    FROM system_components
    WHERE system_id = ?
    ORDER BY id ASC
    `,
    [systemId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// =======================================
// GET /systems/:id/consumption - Get system material consumption
// =======================================
router.get("/:id/consumption", (req, res) => {
  const systemId = req.params.id;

  db.all(
    `
    SELECT
      spm.*,
      p.name AS product_name,
      p.unit AS product_unit
    FROM system_product_materials spm
    LEFT JOIN products p ON spm.product_id = p.id
    WHERE spm.system_id = ?
    ORDER BY spm.id ASC
    `,
    [systemId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// =======================================
// GET /systems/:id/calculate - Calculate system cost
// =======================================
router.get("/:id/calculate", (req, res) => {
  const systemId = req.params.id;

  // Get system basic info
  db.get(
    `
    SELECT *
    FROM systems
    WHERE id = ?
    `,
    [systemId],
    (err, system) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!system) {
        return res.status(404).json({ error: "النظام غير موجود" });
      }

      // Get material consumption
      db.all(
        `
        SELECT
          spm.*,
          p.name AS product_name,
          p.purchase_price AS product_price
        FROM system_product_materials spm
        LEFT JOIN products p ON spm.product_id = p.id
        WHERE spm.system_id = ?
        `,
        [systemId],
        (err, materials) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Calculate total material cost
          const totalMaterialCost = materials.reduce((sum, m) => {
            return sum + (m.quantity || 0) * (m.product_price || 0);
          }, 0);

          const totalCost = totalMaterialCost + (system.labor_cost || 0) + (system.other_costs || 0);
          const margin = system.selling_price > 0 ? ((system.selling_price - totalCost) / system.selling_price * 100) : 0;

          res.json({
            system,
            materials,
            totalMaterialCost,
            totalCost,
            margin: margin.toFixed(2)
          });
        }
      );
    }
  );
});

module.exports = router;