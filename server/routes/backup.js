const express = require("express");
const router = express.Router();
const db = require("../database");
const fs = require("fs");
const path = require("path");

// Backup directory
const BACKUP_DIR = path.join(__dirname, "../backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Verify backup file integrity
function verifyBackupFile(filepath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(filepath)) {
      return resolve({ valid: false, error: "Backup file not found" });
    }

    const stats = fs.statSync(filepath);
    if (stats.size === 0) {
      return resolve({ valid: false, error: "Backup file is empty" });
    }

    // For SQLite database files, verify it's a valid SQLite database
    const fileContent = fs.readFileSync(filepath);
    const sqliteHeader = Buffer.from("SQLite format 3\0", "utf8");
    
    if (fileContent.slice(0, 16).toString("utf8") !== sqliteHeader.slice(0, 16).toString("utf8")) {
      return resolve({ valid: false, error: "Not a valid SQLite database file" });
    }

    // Verify critical tables exist
    const criticalTables = ["users", "clients", "projects", "invoices", "products"];
    let validTables = 0;

    db.serialize(() => {
      criticalTables.forEach((table) => {
        db.get(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
          [table],
          (err, row) => {
            if (row) validTables++;
          }
        );
      });
    });

    // For SQL backup files, verify it contains expected structure
    if (filepath.endsWith(".sql")) {
      const sqlContent = fs.readFileSync(filepath, "utf8");
      const hasCreateTable = sqlContent.toLowerCase().includes("create table");
      const hasInsert = sqlContent.toLowerCase().includes("insert into");
      if (!hasCreateTable && sqlContent.trim().length > 0) {
        return resolve({ valid: false, error: "Invalid SQL backup format" });
      }
    }

    resolve({ valid: true, size: stats.size });
  });
}

// Create database backup
router.post("/create", async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(BACKUP_DIR, `ideail_backup_${timestamp}.db`);

  try {
    // Copy the database file
    const sourceDb = path.join(__dirname, "../ideail.db");
    fs.copyFileSync(sourceDb, backupFile);

    // Also create a SQL dump
    const sqlFile = path.join(BACKUP_DIR, `ideail_backup_${timestamp}.sql`);
    
    // Get all table names
    const tables = await new Promise((resolve, reject) => {
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    let sqlContent = "-- IDEAIL ERP Database Backup\n";
    sqlContent += `-- Created: ${new Date().toISOString()}\n`;
    sqlContent += `-- Version: IDEAIL ERP v1.0\n\n`;

    // Generate SQL dump for each table
    for (const table of tables) {
      const tableName = table.name;
      const createTable = await new Promise((resolve, reject) => {
        db.get(`SELECT sql FROM sqlite_master WHERE name=?`, [tableName], (err, row) => {
          if (err) reject(err);
          else resolve(row?.sql || "");
        });
      });

      sqlContent += `-- Table: ${tableName}\n${createTable || ""};\n\n`;

      // Get table data
      const data = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        data.forEach((row) => {
          const values = columns.map((col) => {
            const val = row[col];
            if (val === null) return "NULL";
            if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
            return val;
          });
          sqlContent += `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")});\n`;
        });
        sqlContent += "\n";
      }
    }

    fs.writeFileSync(sqlFile, sqlContent);

    res.json({
      success: true,
      message: "Backup created successfully",
      backup: {
        id: timestamp,
        dbFile: backupFile,
        sqlFile: sqlFile,
        created: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Backup error:", err);
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
        const ext = path.extname(f);
        const basename = path.basename(f, ext);
        return {
          filename: f,
          basename,
          path: path.join(BACKUP_DIR, f),
          size: stats.size,
          created: stats.birthtime,
          type: ext.substring(1),
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

// Verify backup before restore
router.get("/verify/:filename", async (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "Backup not found" });
  }

  try {
    const result = await verifyBackupFile(filepath);
    res.json({
      filename,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore from backup - WITH VERIFICATION
router.post("/restore", async (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: "Filename is required" });
  }

  const filepath = path.join(BACKUP_DIR, filename);

  // Verify backup integrity first
  const verification = await verifyBackupFile(filepath);
  if (!verification.valid) {
    return res.status(400).json({
      error: "Backup verification failed",
      reason: verification.error,
    });
  }

  try {
    // Close current database connection
    const sourceDb = path.join(__dirname, "../ideail.db");
    const tempDb = path.join(__dirname, "../ideail_temp.db");

    // Copy backup to temp location
    fs.copyFileSync(filepath, tempDb);

    // Verify temp database has required tables
    const requiredTables = ["users", "clients", "projects"];
    for (const table of requiredTables) {
      const exists = fs.readFileSync(tempDb, "utf8").includes(`CREATE TABLE ${table}`);
      if (!exists) {
        fs.unlinkSync(tempDb);
        return res.status(400).json({ error: `Backup missing required table: ${table}` });
      }
    }

    // Replace current database with backup
    fs.unlinkSync(sourceDb);
    fs.renameSync(tempDb, sourceDb);

    // Reinitialize database connection
    res.json({
      success: true,
      message: "Backup restored successfully",
      verified: true,
      restored_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Restore error:", err);
    res.status(500).json({ error: err.message });
  }
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