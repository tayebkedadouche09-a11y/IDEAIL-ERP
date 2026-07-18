const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const db = require("../database");

const JWT_SECRET = process.env.JWT_SECRET || "ideail-secret-key";

router.post("/register", async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, full_name || null, role || "EMPLOYEE"],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return res.status(409).json({ error: "Username already exists" });
          }
          return res.status(500).json({ error: err.message });
        }

        return res.status(201).json({
          success: true,
          message: "User registered successfully",
          user: {
            id: this.lastID,
            username,
            full_name: full_name || null,
            role: role || "EMPLOYEE",
          },
        });
      }
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (!user) {
          return res.status(401).json({ error: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(401).json({ error: "Invalid username or password" });
        }

        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            role: user.role,
          },
          JWT_SECRET,
          { expiresIn: "8h" }
        );

        return res.json({
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
          },
        });
      }
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
