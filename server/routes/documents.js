const express = require("express");
const router = express.Router();
const db = require("../database");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Setup file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/documents");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Get all documents
router.get("/", (req, res) => {
  db.all(
    `SELECT d.*, 
       p.name as project_name, 
       c.name as client_name, 
       s.name as supplier_name,
       CASE 
         WHEN d.project_id IS NOT NULL THEN p.name
         WHEN d.client_id IS NOT NULL THEN c.name
         WHEN d.supplier_id IS NOT NULL THEN s.name
         ELSE '-'
       END as related_name
     FROM documents d
     LEFT JOIN projects p ON d.project_id = p.id
     LEFT JOIN clients c ON d.client_id = c.id
     LEFT JOIN suppliers s ON d.supplier_id = s.id
     ORDER BY d.id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Upload document
router.post("/", upload.single("file"), (req, res) => {
  const {
    name, category, type, project_id, client_id, supplier_id, description
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Document name is required" });
  }

  const file = req.file;
  const file_path = file ? `/uploads/documents/${file.filename}` : null;
  const file_type = file ? file.mimetype : null;
  const file_size = file ? file.size : 0;

  db.run(
    `INSERT INTO documents 
     (name, category, type, project_id, client_id, supplier_id, file_path, file_type, file_size, description) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, category || 'projects', type || 'photo',
      project_id || null, client_id || null, supplier_id || null,
      file_path, file_type, file_size, description || null
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Document uploaded" });
    }
  );
});

// Update document
router.put("/:id", (req, res) => {
  const {
    name, category, type, project_id, client_id, supplier_id, description
  } = req.body;

  db.run(
    `UPDATE documents SET 
     name=?, category=?, type=?, project_id=?, client_id=?, supplier_id=?, description=? 
     WHERE id=?`,
    [name, category, type, project_id, client_id, supplier_id, description, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Document updated" });
    }
  );
});

// Delete document
router.delete("/:id", (req, res) => {
  db.get("SELECT file_path FROM documents WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Delete file if exists
    if (row && row.file_path) {
      const filePath = path.join(__dirname, "..", row.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    db.run("DELETE FROM documents WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Document deleted" });
    });
  });
});

module.exports = router;