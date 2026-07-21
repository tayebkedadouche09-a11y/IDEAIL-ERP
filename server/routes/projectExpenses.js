const express = require("express");
const router = express.Router();

const db = require("../database");
const { refreshProjectProfitability } = require("../controllers/profitability");

// =======================================
// GET PROJECT EXPENSES
// =======================================

router.get("/:project_id", (req, res) => {
  db.all(
    `
    SELECT *
    FROM project_expenses
    WHERE project_id = ?
    ORDER BY id DESC
    `,
    [req.params.project_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

// =======================================
// ADD EXPENSE
// =======================================

router.post("/", (req, res) => {
  const { project_id, title, amount, expense_date, notes } = req.body;

  if (!project_id || !title) {
    return res.status(400).json({ error: "بيانات ناقصة" });
  }

  db.run(
    `
    INSERT INTO project_expenses
    (project_id, title, amount, expense_date, notes)
    VALUES(?,?,?,?,?)
    `,
    [project_id, title, amount || 0, expense_date || null, notes || ""],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      refreshProjectProfitability(db, project_id, (profitErr, summary) => {
        if (profitErr) {
          return res.status(500).json({ error: profitErr.message });
        }

        res.json({
          success: true,
          id: this.lastID,
          amount: Number(amount || 0),
          profitability: summary,
        });
      });
    }
  );
});

// =======================================
// DELETE EXPENSE
// =======================================

router.delete("/:id", (req, res) => {
  db.get(
    "SELECT project_id FROM project_expenses WHERE id = ?",
    [req.params.id],
    (err, expense) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!expense) {
        return res.status(404).json({ error: "البند غير موجود" });
      }

      db.run(
        "DELETE FROM project_expenses WHERE id = ?",
        [req.params.id],
        function (deleteErr) {
          if (deleteErr) {
            return res.status(500).json({ error: deleteErr.message });
          }

          refreshProjectProfitability(db, expense.project_id, (profitErr, summary) => {
            if (profitErr) {
              return res.status(500).json({ error: profitErr.message });
            }

            res.json({ success: true, profitability: summary });
          });
        }
      );
    }
  );
});

module.exports = router;
