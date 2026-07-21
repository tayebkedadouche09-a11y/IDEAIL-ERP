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

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text",
]);

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, allowedMimeTypes.has(file.mimetype)),
});

// Get all documents
router.get("/", (req, res) => {
  db.all(
    `SELECT d.*, 
       p.name as project_name, 
       c.name as client_name, 
       s.name as supplier_name,
       e.first_name || ' ' || e.last_name as employee_name,
       i.invoice_number,
       q.devis_number as quotation_number,
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
     LEFT JOIN employees e ON d.employee_id = e.id
     LEFT JOIN invoices i ON d.invoice_id = i.id
     LEFT JOIN devis q ON d.quotation_id = q.id
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
    name, category, type, project_id, client_id, supplier_id, employee_id,
    invoice_id, quotation_id, description
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
     (name, category, type, project_id, client_id, supplier_id, employee_id, invoice_id, quotation_id, file_path, file_type, file_size, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, category || 'projects', type || 'photo',
      project_id || null, client_id || null, supplier_id || null,
      employee_id || null, invoice_id || null, quotation_id || null,
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
    name, category, type, project_id, client_id, supplier_id, employee_id,
    invoice_id, quotation_id, description
  } = req.body;

  db.run(
    `UPDATE documents SET 
     name=?, category=?, type=?, project_id=?, client_id=?, supplier_id=?, employee_id=?, invoice_id=?, quotation_id=?, description=?
     WHERE id=?`,
    [name, category, type, project_id, client_id, supplier_id, employee_id, invoice_id, quotation_id, description, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Document updated" });
    }
  );
});

// Download through an authenticated endpoint so document access is auditable.
router.get("/:id/download", (req, res) => {
  db.get("SELECT name, file_path FROM documents WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row || !row.file_path) return res.status(404).json({ error: "Document file not found" });
    const relativePath = row.file_path.replace(/^[/\\]+/, "");
    const filePath = path.resolve(__dirname, "..", relativePath);
    const uploadsPath = path.resolve(__dirname, "..", "uploads");
    if (!filePath.startsWith(`${uploadsPath}${path.sep}`) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Document file not found" });
    }
    res.download(filePath, row.name);
  });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "File must not exceed 20 MB" : err.message });
  }
  next(err);
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
