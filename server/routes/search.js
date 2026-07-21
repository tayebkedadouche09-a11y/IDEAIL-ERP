const express = require("express");
const router = express.Router();
const db = require("../database");

// Global search across all modules
router.get("/", (req, res) => {
  const { query, type } = req.query;

  if (!query) {
    return res.json({ results: {} });
  }

  const searchTerm = `%${query}%`;
  const results = {
    clients: [],
    projects: [],
    invoices: [],
    payments: [],
    products: [],
    documents: [],
    devis: [],
    employees: [],
    suppliers: [],
  };

  const queries = [];

  // Search clients
  queries.push(
    new Promise((resolve) => {
      db.all(
        `SELECT id, name, company_name, phone, email FROM clients 
         WHERE name LIKE ? OR company_name LIKE ? OR phone LIKE ? OR email LIKE ? 
         LIMIT 10`,
        [searchTerm, searchTerm, searchTerm, searchTerm],
        (err, rows) => {
          results.clients = err ? [] : rows;
          resolve();
        }
      );
    })
  );

  // Search projects
  queries.push(
    new Promise((resolve) => {
      db.all(
        `SELECT id, name, project_code, status, client_id FROM projects 
         WHERE name LIKE ? OR project_code LIKE ? 
         LIMIT 10`,
        [searchTerm, searchTerm],
        (err, rows) => {
          results.projects = err ? [] : rows;
          resolve();
        }
      );
    })
  );

  // Search invoices
  queries.push(
    new Promise((resolve) => {
      db.all(
        `SELECT id, invoice_number, amount, status, client_id, invoice_date FROM invoices 
         WHERE invoice_number LIKE ? OR reference_number LIKE ? 
         LIMIT 10`,
        [searchTerm, searchTerm],
        (err, rows) => {
          results.invoices = err ? [] : rows;
          resolve();
        }
      );
    })
  );

  // Search payments
  queries.push(
    new Promise((resolve) => {
      db.all(
        `SELECT id, amount, payment_method, payment_date, reference_number FROM payments 
         WHERE reference_number LIKE ? OR notes LIKE ? 
         LIMIT 10`,
        [searchTerm, searchTerm],
        (err, rows) => {
          results.payments = err ? [] : rows;
          resolve();
        }
      );
    })
  );

  // Search products
  queries.push(
    new Promise((resolve) => {
      db.all(
        `SELECT id, name, reference_code, category, current_stock FROM products 
         WHERE name LIKE ? OR reference_code LIKE ? 
         LIMIT 10`,
        [searchTerm, searchTerm],
        (err, rows) => {
          results.products = err ? [] : rows;
          resolve();
        }
      );
    })
  );

  // Search documents
  queries.push(
    new Promise((resolve) => {
      db.all(
        `SELECT id, name, document_type, file_path, entity_type FROM documents 
         WHERE name LIKE ? 
         LIMIT 10`,
        [searchTerm],
        (err, rows) => {
          results.documents = err ? [] : rows;
          resolve();
        }
      );
    })
  );

  // Search devis/quotes
  queries.push(
    new Promise((resolve) => {
      db.all(
        `SELECT id, devis_number, amount, status, client_id FROM devis 
         WHERE devis_number LIKE ? OR title LIKE ? 
         LIMIT 10`,
        [searchTerm, searchTerm],
        (err, rows) => {
          results.devis = err ? [] : rows;
          resolve();
        }
      );
    })
  );

  // Search employees
  queries.push(
    new Promise((resolve) => {
      db.all(
        `SELECT id, first_name, last_name, phone, position, department FROM employees 
         WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? 
         LIMIT 10`,
        [searchTerm, searchTerm, searchTerm],
        (err, rows) => {
          results.employees = err ? [] : rows;
          resolve();
        }
      );
    })
  );

  // Search suppliers
  queries.push(
    new Promise((resolve) => {
      db.all(
        `SELECT id, name, contact_person, phone FROM suppliers 
         WHERE name LIKE ? OR contact_person LIKE ? OR phone LIKE ? 
         LIMIT 10`,
        [searchTerm, searchTerm, searchTerm],
        (err, rows) => {
          results.suppliers = err ? [] : rows;
          resolve();
        }
      );
    })
  );

  Promise.all(queries).then(() => {
    res.json({
      query,
      results,
      total: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
    });
  });
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
      sql = `SELECT * FROM invoices WHERE invoice_number LIKE ? OR reference_number LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, searchTerm, parseInt(limit), offset];
      break;
    case "payments":
      sql = `SELECT * FROM payments WHERE reference_number LIKE ? OR notes LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, searchTerm, parseInt(limit), offset];
      break;
    case "products":
      sql = `SELECT * FROM products WHERE name LIKE ? OR reference_code LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, searchTerm, parseInt(limit), offset];
      break;
    case "documents":
      sql = `SELECT * FROM documents WHERE name LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, parseInt(limit), offset];
      break;
    case "devis":
      sql = `SELECT * FROM devis WHERE devis_number LIKE ? OR title LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, searchTerm, parseInt(limit), offset];
      break;
    case "employees":
      sql = `SELECT * FROM employees WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, searchTerm, searchTerm, parseInt(limit), offset];
      break;
    case "suppliers":
      sql = `SELECT * FROM suppliers WHERE name LIKE ? OR contact_person LIKE ? OR phone LIKE ? LIMIT ? OFFSET ?`;
      params = [searchTerm, searchTerm, searchTerm, parseInt(limit), offset];
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