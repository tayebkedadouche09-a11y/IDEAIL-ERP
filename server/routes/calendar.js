const express = require("express");
const router = express.Router();
const db = require("../database");

// =======================================
// CALENDAR EVENTS CRUD
// =======================================

// Get all events (optionally filtered by date range)
router.get("/", (req, res) => {
  const { start_date, end_date, type, project_id, client_id, page = 1, limit = 20, search = "", status } = req.query;
  
  let sql = `
    SELECT c.*, 
           p.name as project_name, 
           cl.name as client_name,
           e.first_name || ' ' || e.last_name as employee_name
    FROM calendar_events c
    LEFT JOIN projects p ON c.project_id = p.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN employees e ON c.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += " AND (c.title LIKE ? OR c.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (start_date) {
    sql += " AND c.event_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    sql += " AND c.event_date <= ?";
    params.push(end_date);
  }
  if (type) {
    sql += " AND c.type = ?";
    params.push(type);
  }
  if (project_id) {
    sql += " AND c.project_id = ?";
    params.push(project_id);
  }
  if (client_id) {
    sql += " AND c.client_id = ?";
    params.push(client_id);
  }
  if (status) {
    sql += " AND c.status = ?";
    params.push(status);
  }

  const offset = (page - 1) * limit;
  sql += " ORDER BY c.event_date ASC, c.start_time ASC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM calendar_events c WHERE 1=1 ${
      search ? " AND (c.title LIKE ? OR c.description LIKE ?)" : ""
    }`;
    const countParams = search ? [`%${search}%`, `%${search}%`] : [];
    
    db.get(countSql, countParams, (err2, countRow) => {
      if (err2) return res.status(500).json({ error: err2.message });
      
      res.json({
        data: rows,
        pagination: {
          total: countRow.total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countRow.total / limit),
        }
      });
    });
  });
});

// Get calendar statistics.  These routes must be declared before /:id,
// otherwise Express treats "stats" and "upcoming" as event identifiers.
router.get("/stats/summary", (req, res) => {
  const queries = {
    total: "SELECT COUNT(*) as count FROM calendar_events",
    thisMonth: "SELECT COUNT(*) as count FROM calendar_events WHERE strftime('%Y-%m', event_date) = strftime('%Y-%m', 'now')",
    upcoming: "SELECT COUNT(*) as count FROM calendar_events WHERE event_date >= date('now') AND status = 'planned'",
    completed: "SELECT COUNT(*) as count FROM calendar_events WHERE status = 'completed'",
    projectDeadlines: "SELECT COUNT(*) as count FROM calendar_events WHERE type = 'project_deadline'",
    paymentsDue: "SELECT COUNT(*) as count FROM calendar_events WHERE type = 'payment_due'",
  };

  const results = {};
  let completed = 0;
  Object.entries(queries).forEach(([key, sql]) => {
    db.get(sql, [], (err, row) => {
      results[key] = !err && row ? row.count || 0 : 0;
      completed += 1;
      if (completed === Object.keys(queries).length) res.json(results);
    });
  });
});

router.get("/upcoming/list", (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  db.all(
    `SELECT c.*, p.name as project_name, cl.name as client_name
     FROM calendar_events c
     LEFT JOIN projects p ON c.project_id = p.id
     LEFT JOIN clients cl ON c.client_id = cl.id
     WHERE c.event_date >= date('now')
     ORDER BY c.event_date ASC, c.start_time ASC LIMIT ?`,
    [limit],
    (err, rows) => err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
});

// Get single event
router.get("/:id", (req, res) => {
  const sql = `
    SELECT c.*, 
           p.name as project_name, 
           cl.name as client_name
    FROM calendar_events c
    LEFT JOIN projects p ON c.project_id = p.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE c.id = ?
  `;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Event not found" });
    res.json(row);
  });
});

// Create event
router.post("/", (req, res) => {
  const {
    title,
    description,
    event_date,
    start_time,
    end_time,
    type,
    project_id,
    client_id,
    employee_id,
    status,
    notes
  } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({ error: "Title and event date are required" });
  }

  // Generate event code
  const eventCode = "EVT-" + Date.now();

  db.run(
    `INSERT INTO calendar_events 
     (event_code, title, description, event_date, start_time, end_time, type, 
      project_id, client_id, employee_id, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      eventCode,
      title,
      description || null,
      event_date,
      start_time || null,
      end_time || null,
      type || "general",
      project_id || null,
      client_id || null,
      employee_id || null,
      status || "planned",
      notes || null
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, event_code: eventCode });
    }
  );
});

// Update event
router.put("/:id", (req, res) => {
  const {
    title,
    description,
    event_date,
    start_time,
    end_time,
    type,
    project_id,
    client_id,
    employee_id,
    status,
    notes
  } = req.body;

  db.run(
    `UPDATE calendar_events SET 
     title = ?, description = ?, event_date = ?, start_time = ?, end_time = ?, 
     type = ?, project_id = ?, client_id = ?, employee_id = ?, status = ?, notes = ?
     WHERE id = ?`,
    [
      title,
      description || null,
      event_date,
      start_time || null,
      end_time || null,
      type || "general",
      project_id || null,
      client_id || null,
      employee_id || null,
      status || "planned",
      notes || null,
      req.params.id
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true, message: "Event updated" });
    }
  );
});

// Delete event
router.delete("/:id", (req, res) => {
  db.run("DELETE FROM calendar_events WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Event not found" });
    res.json({ success: true, message: "Event deleted" });
  });
});

// =======================================
// AUTOMATIC SYNC ENDPOINTS (Phase 7)
// =======================================

// Sync project deadlines to calendar events
router.post("/sync/project-deadlines", (req, res) => {
  db.all(
    `SELECT id, name, expected_end_date, project_code FROM projects 
     WHERE expected_end_date IS NOT NULL AND expected_end_date != '' 
     AND status IN ('in_progress', 'on_hold', 'approved')`,
    [],
    (err, projects) => {
      if (err) return res.status(500).json({ error: err.message });

      let synced = 0;
      projects.forEach((project) => {
        // Check if deadline already exists
        db.get(
          "SELECT id FROM calendar_events WHERE project_id = ? AND type = 'project_deadline'",
          [project.id],
          (err2, existing) => {
            if (err2 || existing) return;

            const eventCode = "DLINE-" + project.id;
            db.run(
              `INSERT INTO calendar_events 
               (event_code, title, description, event_date, type, project_id, status)
               VALUES (?, ?, ?, ?, 'project_deadline', ?, 'planned')`,
              [
                eventCode,
                `${project.project_code || ""} Deadline: ${project.name}`,
                `Project deadline for ${project.name}`,
                project.expected_end_date,
                project.id
              ],
              (err3) => {
                if (!err3) synced++;
              }
            );
          }
        );
      });

      setTimeout(() => {
        res.json({ success: true, message: `Synced ${synced} project deadlines` });
      }, 500);
    }
  );
});

// Sync payment due dates to calendar events
router.post("/sync/payment-due-dates", (req, res) => {
  db.all(
    `SELECT id, invoice_number, client_id, due_date, remaining_amount 
     FROM invoices 
     WHERE due_date IS NOT NULL AND status != 'paid'`,
    [],
    (err, invoices) => {
      if (err) return res.status(500).json({ error: err.message });

      let synced = 0;
      const today = new Date().toISOString().slice(0, 10);
      
      invoices.forEach((invoice) => {
        if (invoice.due_date >= today) {
          // Check if due date already exists
          db.get(
            "SELECT id FROM calendar_events WHERE type = 'payment_due' AND title = ?",
            [`Payment Due: ${invoice.invoice_number}`],
            (err2, existing) => {
              if (err2 || existing) return;

              const eventCode = "PDUE-" + invoice.id;
              db.run(
                `INSERT INTO calendar_events 
                 (event_code, title, description, event_date, type, client_id, status)
                 VALUES (?, ?, ?, ?, 'payment_due', ?, 'planned')`,
                [
                  eventCode,
                  `Payment Due: ${invoice.invoice_number}`,
                  `Amount due: ${invoice.remaining_amount || invoice.amount} DA`,
                  invoice.due_date,
                  invoice.client_id
                ],
                (err3) => {
                  if (!err3) synced++;
                }
              );
            }
          );
        }
      });

      setTimeout(() => {
        res.json({ success: true, message: `Synced ${synced} payment due dates` });
      }, 500);
    }
  );
});

module.exports = router;
