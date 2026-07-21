const express = require("express");
const db = require("../database");

const router = express.Router();

// Whitelisted resources make the generic admin API safe while allowing each
// enterprise module to share predictable CRUD, search and pagination.
const RESOURCES = {
  companies: { table: "companies", required: ["name"] },
  branches: { table: "branches", required: ["company_id", "name"] },
  accounts: { table: "chart_of_accounts", required: ["code", "name", "account_type"] },
  periods: { table: "financial_periods", required: ["name", "start_date", "end_date"] },
  journalEntries: { table: "journal_entries", required: ["entry_date"] },
  purchaseRequests: { table: "purchase_requests", required: [] },
  assets: { table: "assets", required: ["name"] },
  qualityInspections: { table: "quality_inspections", required: ["subject_type"] },
  billsOfMaterials: { table: "bills_of_materials", required: ["product_id"] },
  productionOrders: { table: "production_orders", required: ["product_id"] },
  leads: { table: "leads", required: ["name"] },
  tasks: { table: "tasks", required: ["title"] },
  teams: { table: "teams", required: ["name"] },
  contracts: { table: "contracts", required: ["title"] },
  reportTemplates: { table: "report_templates", required: ["name", "data_source"] },
  workflows: { table: "workflows", required: ["name", "entity_type", "definition_json"] },
  approvals: { table: "approvals", required: ["entity_type", "entity_id"] },
  portalRequests: { table: "portal_requests", required: ["portal_type", "requester_name", "subject"] },
  maintenance: { table: "maintenance_schedules", required: ["title"] },
};

function resource(name, res) {
  const item = RESOURCES[name];
  if (!item) {
    res.status(404).json({ error: "Unknown enterprise resource" });
    return null;
  }
  return item;
}

function cleanPayload(body) {
  return Object.fromEntries(Object.entries(body || {}).filter(([key, value]) =>
    /^[a-z_][a-z0-9_]*$/i.test(key) && key !== "id" && key !== "created_at" && value !== undefined
  ));
}

router.get("/resources", (req, res) => res.json(Object.keys(RESOURCES)));

router.get("/:resource", (req, res) => {
  const config = resource(req.params.resource, res);
  if (!config) return;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const search = String(req.query.search || "").trim();
  const offset = (page - 1) * limit;
  const query = search ? ` WHERE CAST(${config.table}.rowid AS TEXT) LIKE ? OR ${config.table}.name LIKE ?` : "";
  // A name column is not universal; retry without it for ledger-style tables.
  const params = search ? [`%${search}%`, `%${search}%`] : [];
  db.all(`SELECT * FROM ${config.table}${query} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limit, offset], (err, data) => {
    if (err && search) {
      return db.all(`SELECT * FROM ${config.table} ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset], (fallbackErr, fallback) => {
        if (fallbackErr) return res.status(500).json({ error: fallbackErr.message });
        db.get(`SELECT COUNT(*) total FROM ${config.table}`, [], (countErr, count) => {
          if (countErr) return res.status(500).json({ error: countErr.message });
          res.json({ data: fallback, pagination: { page, limit, total: count.total } });
        });
      });
    }
    if (err) return res.status(500).json({ error: err.message });
    db.get(`SELECT COUNT(*) total FROM ${config.table}`, [], (countErr, count) => {
      if (countErr) return res.status(500).json({ error: countErr.message });
      res.json({ data, pagination: { page, limit, total: count.total } });
    });
  });
});

router.get("/:resource/:id", (req, res) => {
  const config = resource(req.params.resource, res);
  if (!config) return;
  db.get(`SELECT * FROM ${config.table} WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Record not found" });
    res.json(row);
  });
});

router.post("/:resource", (req, res) => {
  const config = resource(req.params.resource, res);
  if (!config) return;
  const payload = cleanPayload(req.body);
  const missing = config.required.filter((key) => !payload[key]);
  if (missing.length) return res.status(400).json({ error: `Required fields: ${missing.join(", ")}` });
  const keys = Object.keys(payload);
  if (!keys.length) return res.status(400).json({ error: "No values provided" });
  db.run(`INSERT INTO ${config.table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`, keys.map((key) => payload[key]), function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json({ id: this.lastID, ...payload });
  });
});

router.put("/:resource/:id", (req, res) => {
  const config = resource(req.params.resource, res);
  if (!config) return;
  const payload = cleanPayload(req.body);
  const keys = Object.keys(payload);
  if (!keys.length) return res.status(400).json({ error: "No values provided" });
  db.run(`UPDATE ${config.table} SET ${keys.map((key) => `${key} = ?`).join(", ")} WHERE id = ?`, [...keys.map((key) => payload[key]), req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (!this.changes) return res.status(404).json({ error: "Record not found" });
    res.json({ id: Number(req.params.id), ...payload });
  });
});

router.delete("/:resource/:id", (req, res) => {
  const config = resource(req.params.resource, res);
  if (!config) return;
  db.run(`DELETE FROM ${config.table} WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (!this.changes) return res.status(404).json({ error: "Record not found" });
    res.status(204).end();
  });
});

module.exports = router;
