const express = require("express");
const router = express.Router();
const db = require("../database");

// Global search across all modules
router.get("/", (req, res) => {
  const { query, type } = req.query;

  if (!query) {
    return res.json({ results: [] });
  }

  const searchTerm = `%${query}%`;
  const results = {
    clients: [],
    projects: [],
    invoices: [],
    payments: [],
    products: [],
    documents: [],
  };

  // Search clients
  db.all(
    `SELECT id, name, company_name, phone, email FROM clients 
     WHERE name LIKE ? OR company_name LIKE ? OR phone LIKE ? OR email LIKE ? 
     LIMIT 10`,
    [searchTerm, searchTerm, searchTerm, searchTerm],
    (err, rows) => {
      if (!err) results.clients = rows;
    }
  );

  // Search projects
  db.all(
    `SELECT id, name, project_code, status FROM projects 
     WHERE name LIKE ? OR project_code LIKE ? 
     LIMIT 10`,
    [searchTerm, searchTerm],
    (err, rows) => {
      if (!err) results.projects = rows;
    }
  );

  // Search invoices
  db.all(
    `SELECT id, invoice_number, amount, status FROM invoices 
     WHERE invoice_number LIKE ? 
     LIMIT 10`,
    [searchTerm],
    (err, rows) => {
      if (!err) results.invoices = rows;
    }
  );

  // Search payments
  db.all(
    `SELECT id, amount, payment_method, payment_date FROM payments 
     WHERE reference_number LIKE ? 
     LIMIT 10`,
    [searchTerm],
    (err, rows) => {
      if (!err) results.payments = rows;
    }
  );

  // Search products
  db.all(
    `SELECT id, name, reference_code, category FROM products 
     WHERE name LIKE ? OR reference_code LIKE ? 
     LIMIT 10`,
    [searchTerm, searchTerm],
    (err, rows) => {
      if (!err) results.products = rows;
    }
  );

  // Search documents
  db.all(
    `SELECT id, name, document_type, file_path FROM documents 
     WHERE name LIKE ? 
     LIMIT 10`,
    [searchTerm],
    (err, rows) => {
      if (!err) results.documents = rows;
    }
  );

  // Return combined results after a short delay
  setTimeout(() => {
    res.json({
      query,
      results,
      total: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
    });
  }, 100);
});

// Search in specific module
router.get("/:module", (req, res) => {
  const { module } = req.params;
  const { query, page = 1, limit = 20 } = req.query;

  if (!query) {
    return res.json([]);
  }

  const searchTerm = `%${query}%`;
  const offset = (page - 1) * limit;

  let sql = "";
  let params = [];

  switch (module) {
    case "clients":
      sql = `SELECT * FROM clients WHERE name LIKE ? OR company_name LIKE ? OR phone LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, searchTerm, searchTerm, parseInt(limit), offset];
      break;
    case "projects":
      sql = `SELECT * FROM projects WHERE name LIKE ? OR project_code LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, searchTerm, parseInt(limit), offset];
      break;
    case "invoices":
      sql = `SELECT * FROM invoices WHERE invoice_number LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, parseInt(limit), offset];
      break;
    case "payments":
      sql = `SELECT * FROM payments WHERE reference_number LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, parseInt(limit), offset];
      break;
    case "products":
      sql = `SELECT * FROM products WHERE name LIKE ? OR reference_code LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, searchTerm, parseInt(limit), offset];
      break;
    case "documents":
      sql = `SELECT * FROM documents WHERE name LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, parseInt(limit), offset];
      break;
    default:
      return res.status(400).json({ error: "Invalid module" });
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;