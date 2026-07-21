const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const db = require("../database");
const { generateToken, authenticateToken, requireRole } = require("../middleware/auth");
const { validateLogin, validateRegister, validateChangePassword } = require("../middleware/validate");

// =======================================
// POST /auth/login
// =======================================
router.post("/login", validateLogin, (req, res) => {
  const { username, password } = req.body;

  // Find user by username or email
  db.get(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: "Account is disabled. Contact administrator." });
      }

      // Verify password
      const validPassword = bcryptjs.compareSync(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Update last login
      db.run(
        "UPDATE users SET last_login = datetime('now') WHERE id = ?",
        [user.id]
      );

      // Generate token
      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      });
    }
  );
});

// =======================================
// POST /auth/register (Admin only)
// =======================================
router.post("/register", authenticateToken, requireRole("admin"), validateRegister, (req, res) => {
  const { username, email, password, full_name, role } = req.body;

  // Check if username or email already exists
  db.get(
    "SELECT id FROM users WHERE username = ? OR email = ?",
    [username, email],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (existing) {
        return res.status(400).json({ error: "Username or email already exists" });
      }

      // Hash password
      const hashedPassword = bcryptjs.hashSync(password, 10);

      db.run(
        "INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)",
        [username, email, hashedPassword, full_name || null, role || "user"],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            success: true,
            id: this.lastID,
            message: "User created successfully",
          });
        }
      );
    }
  );
});

// =======================================
// GET /auth/me (Get current user profile)
// =======================================
router.get("/me", authenticateToken, (req, res) => {
  db.get(
    "SELECT id, username, email, full_name, role, is_active, last_login, created_at FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    }
  );
});

// =======================================
// PUT /auth/change-password
// =======================================
router.put("/change-password", authenticateToken, validateChangePassword, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  db.get(
    "SELECT password FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const validPassword = bcryptjs.compareSync(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = bcryptjs.hashSync(newPassword, 10);

      db.run(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, req.user.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({ success: true, message: "Password changed successfully" });
        }
      );
    }
  );
});

// =======================================
// GET /auth/users (Admin only - List all users)
// =======================================
router.get("/users", authenticateToken, requireRole("admin"), (req, res) => {
  db.all(
    "SELECT id, username, email, full_name, role, is_active, last_login, created_at FROM users ORDER BY id ASC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

// =======================================
// PUT /auth/users/:id (Admin only - Update user)
// =======================================
router.put("/users/:id", authenticateToken, requireRole("admin"), (req, res) => {
  const { username, email, full_name, role, is_active } = req.body;
  const userId = req.params.id;

  db.run(
    "UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, is_active = ? WHERE id = ?",
    [username, email, full_name, role, is_active !== undefined ? (is_active ? 1 : 0) : 1, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, message: "User updated successfully" });
    }
  );
});

// =======================================
// DELETE /auth/users/:id (Admin only - Delete user)
// =======================================
router.delete("/users/:id", authenticateToken, requireRole("admin"), (req, res) => {
  const userId = req.params.id;

  // Prevent deleting yourself
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  db.run("DELETE FROM users WHERE id = ?", [userId], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  });
});

module.exports = router;