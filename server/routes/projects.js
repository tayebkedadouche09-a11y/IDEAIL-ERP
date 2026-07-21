const express = require("express");
const router = express.Router();

const db = require("../database");
const { refreshProjectProfitability } = require("../controllers/profitability");
const { projectWorkflow } = require("../services/workflow");
const { eventBus } = require("../services/events");

// =======================================
// GET ALL PROJECTS WITH SEARCH AND PAGINATION
// =======================================

router.get("/", (req, res) => {
  const { search = "", page = 1, limit = 20, status: statusFilter, client_id } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT projects.*, clients.name AS client_name, systems.name AS system_name
    FROM projects
    LEFT JOIN clients ON projects.client_id = clients.id
    LEFT JOIN systems ON projects.system_id = systems.id
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM projects
    LEFT JOIN clients ON projects.client_id = clients.id
    LEFT JOIN systems ON projects.system_id = systems.id
  `;

  let params = [];
  let countParams = [];
  let whereConditions = [];

  // Add search filter
  if (search && search.trim() !== "") {
    whereConditions.push(`(projects.name LIKE ? OR clients.name LIKE ? OR systems.name LIKE ?)`);
    const searchParam = `%${search}%`;
    params = [searchParam, searchParam, searchParam];
    countParams = [searchParam, searchParam, searchParam];
  }

  // Add status filter
  if (statusFilter && statusFilter.trim() !== "") {
    whereConditions.push(`projects.status = ?`);
    params.push(statusFilter);
    countParams.push(statusFilter);
  }

  // Add client filter
  if (client_id && client_id.trim() !== "") {
    whereConditions.push(`projects.client_id = ?`);
    params.push(client_id);
    countParams.push(client_id);
  }

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(" AND ")}`;
    countQuery += ` WHERE ${whereConditions.join(" AND ")}`;
  }

  query += ` ORDER BY projects.id DESC LIMIT ? OFFSET ?`;
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

      // إنشاء رقم عرض مرتب بدون تغيير ID
      const projects = rows.map((project, index) => ({
        ...project,
        project_code: "PRO-" + String(index + 1).padStart(4, "0")
      }));

      res.json({
        data: projects,
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
// GET PROJECT DETAILS
// =======================================

router.get("/:id/profitability", (req, res) => {
  refreshProjectProfitability(db, req.params.id, (err, summary) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(summary);
  });
});

router.get("/:id", (req, res) => {
  db.get(
    `
    SELECT projects.*, clients.name AS client_name, systems.name AS system_name
    FROM projects
    LEFT JOIN clients ON projects.client_id = clients.id
    LEFT JOIN systems ON projects.system_id = systems.id
    WHERE projects.id = ?
    `,
    [req.params.id],
    (err, project) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!project) {
        return res.status(404).json({ error: "المشروع غير موجود" });
      }

      res.json(project);
    }
  );
});

// =======================================
// CREATE PROJECT
// =======================================

router.post("/", (req, res) => {
  const {
    client_id,
    system_id,
    surface_m2,
    name,
    description,
    start_date,
    end_date,
    status,
    amount
  } = req.body;

  // Validation
  if (!client_id) {
    return res.status(400).json({ error: "Client is required" });
  }
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Project name is required" });
  }

  db.run(
    `
    INSERT INTO projects
    (client_id, system_id, surface_m2, name, description, start_date, end_date, status, amount)
    VALUES(?,?,?,?,?,?,?,?,?)
    `,
    [
      client_id,
      system_id || null,
      surface_m2 || 0,
      name,
      description,
      start_date,
      end_date,
      status || "جديد",
      amount || 0
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      refreshProjectProfitability(db, this.lastID, (profitErr, summary) => {
        if (profitErr) {
          return res.status(500).json({ error: profitErr.message });
        }

        // Emit ProjectCreated event
        eventBus.emit("ProjectCreated", { projectId: this.lastID }, db);

        res.json({
          success: true,
          id: this.lastID,
          profitability: summary
        });
      });
    }
  );
});

// =======================================
// UPDATE PROJECT
// =======================================

router.put("/:id", (req, res) => {
  const {
    client_id,
    system_id,
    surface_m2,
    name,
    description,
    start_date,
    end_date,
    status,
    amount
  } = req.body;

  // Validation
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Project name is required" });
  }

  // Get current status for validation
  db.get("SELECT status FROM projects WHERE id = ?", [req.params.id], (err, project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!project) {
      return res.status(404).json({ error: "المشروع غير موجود" });
    }

    // Validate status transition
    if (status && !projectWorkflow.validateTransition(project.status, status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${project.status} to ${status}`
      });
    }

    db.run(
      `
      UPDATE projects SET
      client_id = ?,
      system_id = ?,
      surface_m2 = ?,
      name = ?,
      description = ?,
      start_date = ?,
      end_date = ?,
      status = ?,
      amount = ?
      WHERE id = ?
      `,
      [
        client_id || null,
        system_id || null,
        surface_m2 || 0,
        name,
        description,
        start_date,
        end_date,
        status,
        amount || 0,
        req.params.id
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Record status history if status changed
        if (status && project.status !== status) {
          projectWorkflow.recordStatusHistory(db, req.params.id, project.status, status);

          // Emit ProjectUpdated event
          eventBus.emit("ProjectUpdated", {
            projectId: req.params.id,
            oldStatus: project.status,
            newStatus: status
          }, db);

          // Check if project is completed
          if (status === "مكتمل") {
            eventBus.emit("ProjectCompleted", { projectId: req.params.id }, db);
          }
        }

        res.json({
          success: true,
          message: "تم تحديث المشروع بنجاح"
        });
      }
    );
  });
});

// =======================================
// DELETE PROJECT
// =======================================

router.delete("/:id", (req, res) => {
  db.run(
    `
    DELETE FROM projects
    WHERE id = ?
    `,
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        message: "تم حذف المشروع"
      });
    }
  );
});

// =======================================
// PROJECT WORKERS
// =======================================

router.get("/:id/workers", (req, res) => {
  db.all(
    `
    SELECT project_workers.*, employees.name AS employee_name
    FROM project_workers
    LEFT JOIN employees ON project_workers.employee_id = employees.id
    WHERE project_workers.project_id = ?
    ORDER BY project_workers.id DESC
    `,
    [req.params.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

router.post("/:id/workers", (req, res) => {
  const {
    employee_id,
    days_worked,
    daily_rate,
    notes
  } = req.body;

  const total_cost =
    Number(days_worked || 0) *
    Number(daily_rate || 0);

  db.run(
    `
    INSERT INTO project_workers
    (project_id, employee_id, days_worked, daily_rate, total_cost, notes)
    VALUES(?,?,?,?,?,?)
    `,
    [
      req.params.id,
      employee_id,
      days_worked || 0,
      daily_rate || 0,
      total_cost,
      notes || ""
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      refreshProjectProfitability(db, req.params.id, (profitErr, summary) => {
        if (profitErr) {
          return res.status(500).json({ error: profitErr.message });
        }

        // Emit EmployeeAssignedToProject event
        eventBus.emit("EmployeeAssignedToProject", {
          employeeId: employee_id,
          projectId: req.params.id,
          totalCost: total_cost
        }, db);

        res.json({
          success: true,
          id: this.lastID,
          total_cost,
          profitability: summary
        });
      });
    }
  );
});

// =======================================
// PROJECT TIMELINE
// =======================================

router.get("/:id/timeline", (req, res) => {
  db.all(
    "SELECT * FROM project_timeline WHERE project_id = ? ORDER BY event_date ASC",
    [req.params.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

router.post("/:id/timeline", (req, res) => {
  const { event_type, event_date, title, description, progress_percent } = req.body;

  if (!event_type || !title) {
    return res.status(400).json({ error: "Event type and title are required" });
  }

  db.run(
    `INSERT INTO project_timeline (project_id, event_type, event_date, title, description, progress_percent)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.params.id, event_type, event_date || new Date().toISOString().slice(0, 10), title, description || null, progress_percent || 0],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: this.lastID, message: "Timeline event added" });
    }
  );
});

// =======================================
// PROJECT DOCUMENTS
// =======================================

router.get("/:id/documents", (req, res) => {
  db.all(
    "SELECT * FROM project_documents WHERE project_id = ? ORDER BY created_at DESC",
    [req.params.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

router.post("/:id/documents", (req, res) => {
  const { document_name, document_type, notes } = req.body;

  if (!document_name) {
    return res.status(400).json({ error: "Document name is required" });
  }

  db.run(
    `INSERT INTO project_documents (project_id, document_name, document_type, notes)
     VALUES (?, ?, ?, ?)`,
    [req.params.id, document_name, document_type || "other", notes || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: this.lastID, message: "Document added" });
    }
  );
});

// =======================================
// PROJECT PROFIT CALCULATION
// =======================================

router.get("/:id/profit", (req, res) => {
  const projectId = req.params.id;

  db.get(
    `
    SELECT
      p.amount AS revenue,
      p.material_cost,
      p.labor_cost,
      p.expense_cost,
      p.total_cost,
      p.profit,
      p.profit_margin
    FROM projects p
    WHERE p.id = ?
    `,
    [projectId],
    (err, project) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      db.get(
        `
        SELECT COALESCE(SUM(total_cost), 0) AS material_total
        FROM project_materials
        WHERE project_id = ?
        `,
        [projectId],
        (err, materials) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          db.get(
            `
            SELECT COALESCE(SUM(total_cost), 0) AS labor_total
            FROM project_workers
            WHERE project_id = ?
            `,
            [projectId],
            (err, workers) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              db.get(
                `
                SELECT COALESCE(SUM(amount), 0) AS expense_total
                FROM project_expenses
                WHERE project_id = ?
                `,
                [projectId],
                (err, expenses) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  const totalCost = (materials?.material_total || 0) + (workers?.labor_total || 0) + (expenses?.expense_total || 0);
                  const profit = (project.revenue || 0) - totalCost;
                  const margin = project.revenue > 0 ? ((profit / project.revenue) * 100).toFixed(2) : 0;

                  res.json({
                    revenue: project.revenue || 0,
                    material_cost: materials?.material_total || 0,
                    labor_cost: workers?.labor_total || 0,
                    expense_cost: expenses?.expense_total || 0,
                    total_cost: totalCost,
                    profit: profit,
                    profit_margin: Number(margin),
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

router.delete("/:project_id/workers/:id", (req, res) => {
  db.get("SELECT employee_id, project_id FROM project_workers WHERE id = ?", [req.params.id], (err, worker) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.run(
      `
      DELETE FROM project_workers
      WHERE id = ?
      `,
      [req.params.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Emit EmployeeRemovedFromProject event
        if (worker) {
          eventBus.emit("EmployeeRemovedFromProject", {
            employeeId: worker.employee_id,
            projectId: worker.project_id
          }, db);
        }

        res.json({
          success: true,
          message: "Worker removed from project"
        });
      }
    );
  });
});

module.exports = router;