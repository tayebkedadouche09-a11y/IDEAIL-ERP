const express = require("express");
const router = express.Router();
const db = require("../database");
const upload = require("../upload");

// ==========================
// GET COMPANY INFO
// ==========================

router.get("/", (req, res) => {
  db.get(
    "SELECT * FROM company_info LIMIT 1",
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row || {});
    }
  );
});

// ==========================
// SAVE COMPANY INFO + LOGO
// ==========================

router.post("/", upload.single("logo"), (req, res) => {
  const body = req.body || {};

  const {
    company_name,
    phone,
    email,
    address,
    website,
    activity_type,
    registration_number,
    tax_number,
    rc,
    nif,
    nis,
    vat_rate,
    default_currency,
    payment_terms,
    invoice_prefix,
    quote_prefix,
    language,
    theme,
    date_format
  } = body;

  const logo = req.file ? req.file.filename : null;

  db.get("SELECT * FROM company_info LIMIT 1", [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // UPDATE EXISTING COMPANY
    if (row) {
      const finalLogo = logo || row.logo || null;

      db.run(
        `UPDATE company_info SET
        company_name=?, phone=?, email=?, address=?, website=?, activity_type=?,
        registration_number=?, tax_number=?, rc=?, nif=?, nis=?,
        vat_rate=?, default_currency=?, payment_terms=?, invoice_prefix=?, quote_prefix=?,
        language=?, theme=?, date_format=?, logo=?
        WHERE id=?`,
        [
          company_name, phone, email, address, website, activity_type,
          registration_number, tax_number, rc, nif, nis,
          vat_rate, default_currency, payment_terms, invoice_prefix, quote_prefix,
          language, theme, date_format, finalLogo,
          row.id
        ],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ success: true, message: "Company information updated" });
        }
      );
    }
    // CREATE COMPANY
    else {
      db.run(
        `INSERT INTO company_info
        (company_name, phone, email, address, website, activity_type,
         registration_number, tax_number, rc, nif, nis,
         vat_rate, default_currency, payment_terms, invoice_prefix, quote_prefix,
         language, theme, date_format, logo)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          company_name, phone, email, address, website, activity_type,
          registration_number, tax_number, rc, nif, nis,
          vat_rate, default_currency, payment_terms, invoice_prefix, quote_prefix,
          language, theme, date_format, logo
        ],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ success: true, id: this.lastID });
        }
      );
    }
  });
});

module.exports = router;