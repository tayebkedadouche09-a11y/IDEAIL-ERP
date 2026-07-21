const express = require("express");
const router = express.Router();

const db = require("../database");

// =======================================
// عرض جميع العملاء مع البحث والصفحات
// =======================================

router.get("/", (req, res) => {
  const { search = "", page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT *
    FROM clients
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM clients
  `;

  let params = [];
  let countParams = [];

  // Add search filter
  if (search && search.trim() !== "") {
    query += ` WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR company_name LIKE ?`;
    const searchParam = `%${search}%`;
    params = [searchParam, searchParam, searchParam, searchParam];
    countParams = [searchParam, searchParam, searchParam, searchParam];
  }

  query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  // Get total count
  db.get(countQuery, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get paginated results
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// =======================================
// إنشاء رقم عميل تلقائي CLI-0001
// =======================================

function generateClientCode(callback) {
  db.get(
    `
    SELECT client_code
    FROM clients
    WHERE client_code IS NOT NULL
    ORDER BY id DESC
    LIMIT 1
    `,
    [],
    (err, row) => {
      if (err) {
        return callback(err);
      }

      let number = 1;

      if (row && row.client_code) {
        const lastNumber = parseInt(row.client_code.replace("CLI-", ""));
        number = lastNumber + 1;
      }

      const code = "CLI-" + String(number).padStart(4, "0");
      callback(null, code);
    }
  );
}

// =======================================
// إضافة عميل
// =======================================

router.post("/", (req, res) => {
  const {
    name,
    phone,
    email,
    address,
    company_name,
    status,
    tax_number
  } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      error: "اسم العميل مطلوب"
    });
  }

  generateClientCode((err, client_code) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.run(
      `
      INSERT INTO clients
      (name, phone, email, address, client_code, company_name, status, tax_number)
      VALUES (?,?,?,?,?,?,?,?)
      `,
      [
        name,
        phone,
        email,
        address,
        client_code,
        company_name,
        status || "نشط",
        tax_number
      ],
      function (err) {
        if (err) {
          return res.status(500).json({
            error: err.message
          });
        }

        res.json({
          success: true,
          id: this.lastID,
          client_code,
          message: "تمت إضافة العميل بنجاح"
        });
      }
    );
  });
});

// =======================================
// تعديل عميل
// =======================================

router.put("/:id", (req, res) => {
  const id = req.params.id;

  const {
    name,
    phone,
    email,
    address,
    company_name,
    status,
    tax_number
  } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      error: "اسم العميل مطلوب"
    });
  }

  db.run(
    `
    UPDATE clients SET
    name=?,
    phone=?,
    email=?,
    address=?,
    company_name=?,
    status=?,
    tax_number=?
    WHERE id=?
    `,
    [
      name,
      phone,
      email,
      address,
      company_name,
      status,
      tax_number,
      id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.json({
        success: true,
        message: "تم تعديل العميل بنجاح"
      });
    }
  );
});

// =======================================
// حذف عميل
// =======================================

router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM clients WHERE id=?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.json({
        success: true,
        message: "تم حذف العميل"
      });
    }
  );
});

// =======================================
// حسابات العميل
// =======================================

router.get("/:id/accounts", (req, res) => {
  const client_id = req.params.id;

  db.all(
    `
    SELECT
    client_transactions.*,
    projects.name AS project_name
    FROM client_transactions
    LEFT JOIN projects
    ON client_transactions.project_id = projects.id
    WHERE client_transactions.client_id = ?
    ORDER BY client_transactions.id DESC
    `,
    [client_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.json(rows);
    }
  );
});

// =======================================
// إضافة حساب للعميل
// =======================================

router.post("/:id/accounts", (req, res) => {
  const client_id = req.params.id;

  const {
    project_id,
    work_date,
    description,
    days_worked,
    daily_price,
    paid_amount,
    notes
  } = req.body;

  const total_amount =
    (Number(days_worked) || 0) *
    (Number(daily_price) || 0);

  db.run(
    `
    INSERT INTO client_transactions
    (client_id, project_id, work_date, description, days_worked, daily_price, total_amount, paid_amount, notes)
    VALUES (?,?,?,?,?,?,?,?,?)
    `,
    [
      client_id,
      project_id,
      work_date,
      description,
      days_worked,
      daily_price,
      total_amount,
      paid_amount || 0,
      notes
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.json({
        success: true,
        id: this.lastID,
        total_amount
      });
    }
  );
});

// =======================================
// مجموع حساب العميل
// =======================================

router.get("/:id/accounts-total", (req, res) => {
  const client_id = req.params.id;

  db.get(
    `
    SELECT
    SUM(total_amount) AS total,
    SUM(paid_amount) AS paid
    FROM client_transactions
    WHERE client_id=?
    `,
    [client_id],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.json({
        total: row.total || 0,
        paid: row.paid || 0,
        remaining:
          (row.total || 0) -
          (row.paid || 0)
      });
    }
  );
});

module.exports = router;