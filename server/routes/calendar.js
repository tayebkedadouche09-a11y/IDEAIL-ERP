const express = require("express");
const router = express.Router();
const db = require("../database");

// =======================================
// CALENDAR EVENTS CRUD
// =======================================

// Get all events (optionally filtered by date range)
router.get("/", (req, res) => {
  const { start_date, end_date, type, project_id, client_id } = req.query;
  
  let sql = `
    SELECT c.*, 
           p.name as project_name, 
           cl.name as client_name
    FROM calendar_events c
    LEFT JOIN projects p ON c.project_id = p.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE 1=1
  `;
  const params = [];

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

  sql += " ORDER BY c.event_date ASC, c.start_time ASC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
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

// Get calendar statistics
router.get("/stats/summary", (req, res) => {
  const queries = {
    total: "SELECT COUNT(*) as count FROM calendar_events",
    thisMonth: "SELECT COUNT(*) as count FROM calendar_events WHERE strftime('%Y-%m', event_date) = strftime('%Y-%m', 'now')",
    upcoming: "SELECT COUNT(*) as count FROM calendar_events WHERE event_date >= date('now') AND status = 'planned'",
    completed: "SELECT COUNT(*) as count FROM calendar_events WHERE status = 'completed'",
    projectDeadlines: "SELECT COUNT(*) as count FROM calendar_events WHERE type = 'project_deadline'",
    paymentsDue: "SELECT COUNT(*) as count FROM calendar_events WHERE type = 'payment_due'",
  };

  let results = {};
  let completed = 0;

  Object.entries(queries).forEach(([key, sql]) => {
    db.get(sql, [], (err, row) => {
      if (!err && row) results[key] = row.count || 0;
      else results[key] = 0;
      completed++;
      if (completed === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// Get upcoming events
router.get("/upcoming/list", (req, res) => {
  const { limit = 10 } = req.query;
  
  const sql = `
    SELECT c.*, 
           p.name as project_name, 
           cl.name as client_name
    FROM calendar_events c
    LEFT JOIN projects p ON c.project_id = p.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE c.event_date >= date('now')
    ORDER BY c.event_date ASC, c.start_time ASC
    LIMIT ?
  `;

  db.all(sql, [parseInt(limit)], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;