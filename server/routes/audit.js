const express = require("express");
const router = express.Router();
const db = require("../database");

// Get all audit logs with pagination
router.get("/", (req, res) => {
  const { page = 1, limit = 50, module, action, user_id } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT al.*, u.username, u.full_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (module) {
    sql += " AND al.module = ?";
    params.push(module);
  }
  if (action) {
    sql += " AND al.action = ?";
    params.push(action);
  }
  if (user_id) {
    sql += " AND al.user_id = ?";
    params.push(user_id);
  }

  sql += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get audit log statistics
router.get("/stats", (req, res) => {
  const queries = {
    total: "SELECT COUNT(*) as count FROM audit_logs",
    today: "SELECT COUNT(*) as count FROM audit_logs WHERE date(created_at) = date('now')",
    thisWeek: "SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= date('now', '-7 days')",
    modules: "SELECT module, COUNT(*) as count FROM audit_logs GROUP BY module ORDER BY count DESC LIMIT 5",
  };

  let results = {};
  let completed = 0;

  Object.entries(queries).forEach(([key, sql]) => {
    db.get(sql, [], (err, row) => {
      if (!err && row) {
        if (key === "modules") {
          results[key] = row;
        } else {
          results[key] = row.count;
        }
      }
      completed++;
      if (completed === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// Clear audit logs (admin only)
router.delete("/clear", (req, res) => {
  db.run("DELETE FROM audit_logs", [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Audit logs cleared", deleted: this.changes });
  });
});

module.exports = router;