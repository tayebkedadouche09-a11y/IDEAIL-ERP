const express = require("express");
const router = express.Router();
const db = require("../database");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Backup directory
const BACKUP_DIR = path.join(__dirname, "../backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Create database backup
router.post("/create", (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(BACKUP_DIR, `ideail_backup_${timestamp}.db`);

  try {
    // Copy the database file
    const sourceDb = path.join(__dirname, "../ideail.db");
    fs.copyFileSync(sourceDb, backupFile);

    // Also create a SQL dump
    const sqlFile = path.join(BACKUP_DIR, `ideail_backup_${timestamp}.sql`);
    
    // Get all table names
    db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      [],
      (err, tables) => {
        if (err) {
          console.error("Error getting tables:", err);
        } else {
          let sqlContent = "-- IDEAIL ERP Database Backup\n";
          sqlContent += `-- Created: ${new Date().toISOString()}\n\n`;

          // For each table, get schema and data
          let completed = 0;
          tables.forEach((table) => {
            db.get(`SELECT sql FROM sqlite_master WHERE name='${table.name}'`, [], (err, schema) => {
              if (schema && schema.sql) {
                sqlContent += `-- Table: ${table.name}\n${schema.sql};\n\n`;
              }
              completed++;
              if (completed === tables.length) {
                fs.writeFileSync(sqlFile, sqlContent);
              }
            });
          });
        }
      }
    );

    res.json({
      success: true,
      message: "Backup created successfully",
      file: backupFile,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all backups
router.get("/list", (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter((f) => f.startsWith("ideail_backup_"))
      .map((f) => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          filename: f,
          path: path.join(BACKUP_DIR, f),
          size: stats.size,
          created: stats.birthtime,
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download backup
router.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "Backup not found" });
  }

  res.download(filepath);
});

// Delete backup
router.delete("/:filename", (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    res.json({ success: true, message: "Backup deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get backup statistics
router.get("/stats", (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupCount = files.filter((f) => f.startsWith("ideail_backup_")).length;
    const totalSize = files
      .filter((f) => f.startsWith("ideail_backup_"))
      .reduce((sum, f) => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        return sum + stats.size;
      }, 0);

    res.json({
      totalBackups: backupCount,
      totalSize: totalSize,
      backupDir: BACKUP_DIR,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;