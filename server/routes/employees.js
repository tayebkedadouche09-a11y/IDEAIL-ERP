const express = require("express");
const router = express.Router();

const db = require("../database");
const { eventBus } = require("../services/events");


// =======================================
// GET /employees - List all employees with search and pagination
// =======================================

router.get("/", (req, res) => {
  const { search = "", page = 1, limit = 20, status: statusFilter, department } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT *
    FROM employees
    WHERE 1=1
  `;
  let countQuery = `SELECT COUNT(*) as total FROM employees WHERE 1=1`;
  const params = [];
  const countParams = [];

  // Add search filter
  if (search && search.trim() !== "") {
    query += " AND (name LIKE ? OR job_title LIKE ? OR phone LIKE ? OR email LIKE ?)";
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
    countParams.push(searchParam, searchParam, searchParam, searchParam);
  }

  // Add status filter
  if (statusFilter && statusFilter !== "all") {
    query += " AND status = ?";
    params.push(statusFilter);
    countParams.push(statusFilter);
  }

  // Add department filter
  if (department) {
    query += " AND department = ?";
    params.push(department);
    countParams.push(department);
  }

  query += " ORDER BY id DESC LIMIT ? OFFSET ?";
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

      // Add employee_code to each employee
      const employees = rows.map((emp) => ({
        ...emp,
        employee_code: emp.employee_code || "EMP-" + String(emp.id).padStart(4, "0")
      }));

      res.json({
        data: employees,
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
// POST /employees - Add employee
// =======================================

router.post("/", (req, res) => {
  const {
    name,
    phone,
    email,
    address,
    birth_date,
    hire_date,
    job_title,
    department,
    emergency_contact,
    national_id,
    tax_number,
    social_security_number,
    salary_type,
    daily_rate,
    hourly_rate,
    monthly_salary,
    status,
    notes
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Employee name is required" });
  }

  db.run(
    `INSERT INTO employees (
      name, phone, email, address, birth_date, hire_date,
      job_title, department, emergency_contact, national_id,
      tax_number, social_security_number, salary_type,
      daily_rate, hourly_rate, monthly_salary, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, phone, email, address, birth_date, hire_date,
      job_title, department, emergency_contact, national_id,
      tax_number, social_security_number, salary_type || 'daily',
      daily_rate || 0, hourly_rate || 0, monthly_salary || 0,
      status || 'نشط', notes
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Emit EmployeeCreated event
      eventBus.emit("EmployeeCreated", {
        employeeId: this.lastID,
        name: name,
        jobTitle: job_title
      }, db);

      res.json({
        success: true,
        id: this.lastID,
        message: "Employee added successfully"
      });
    }
  );
});


// =======================================
// PUT /employees/:id - Update employee
// =======================================

router.put("/:id", (req, res) => {
  const id = req.params.id;
  const {
    name,
    phone,
    email,
    address,
    birth_date,
    hire_date,
    job_title,
    department,
    emergency_contact,
    national_id,
    tax_number,
    social_security_number,
    salary_type,
    daily_rate,
    hourly_rate,
    monthly_salary,
    status,
    notes
  } = req.body;

  db.run(
    `UPDATE employees SET
      name=?, phone=?, email=?, address=?, birth_date=?, hire_date=?,
      job_title=?, department=?, emergency_contact=?, national_id=?,
      tax_number=?, social_security_number=?, salary_type=?,
      daily_rate=?, hourly_rate=?, monthly_salary=?, status=?, notes=?
      WHERE id=?`,
    [
      name, phone, email, address, birth_date, hire_date,
      job_title, department, emergency_contact, national_id,
      tax_number, social_security_number, salary_type,
      daily_rate, hourly_rate, monthly_salary, status, notes, id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Emit EmployeeUpdated event
      eventBus.emit("EmployeeUpdated", {
        employeeId: id,
        name: name,
        jobTitle: job_title
      }, db);

      res.json({
        success: true,
        message: "Employee updated successfully"
      });
    }
  );
});


// =======================================
// DELETE /employees/:id
// =======================================

router.delete("/:id", (req, res) => {
  db.run("DELETE FROM employees WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Emit EmployeeDeleted event
    eventBus.emit("EmployeeDeleted", { employeeId: req.params.id }, db);

    res.json({
      success: true,
      message: "Employee deleted successfully"
    });
  });
});


// =======================================
// GET /employees/:id/projects - Get employee projects
// =======================================

router.get("/:id/projects", (req, res) => {
  const employeeId = req.params.id;

  db.all(
    `SELECT p.*, c.name as client_name
     FROM projects p
     JOIN project_workers pw ON p.id = pw.project_id
     LEFT JOIN clients c ON p.client_id = c.id
     WHERE pw.employee_id = ?
     ORDER BY p.created_at DESC`,
    [employeeId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});


// =======================================
// EMPLOYEE CONTRACTS
// =======================================

router.get("/:id/contracts", (req, res) => {
  db.all(
    "SELECT * FROM employee_contracts WHERE employee_id = ? ORDER BY created_at DESC",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

router.post("/:id/contracts", (req, res) => {
  const { contract_type, start_date, end_date, salary, working_hours, probation_months, notes } = req.body;

  db.run(
    `INSERT INTO employee_contracts (employee_id, contract_type, start_date, end_date, salary, working_hours, probation_months, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, contract_type || 'permanent', start_date, end_date, salary || 0, working_hours || 0, probation_months || 0, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Contract added" });
    }
  );
});

router.put("/contracts/:id", (req, res) => {
  const { contract_type, start_date, end_date, salary, working_hours, probation_months, notes } = req.body;

  db.run(
    `UPDATE employee_contracts SET contract_type=?, start_date=?, end_date=?, salary=?, working_hours=?, probation_months=?, notes=? WHERE id=?`,
    [contract_type, start_date, end_date, salary, working_hours, probation_months, notes, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Contract updated" });
    }
  );
});

router.delete("/contracts/:id", (req, res) => {
  db.run("DELETE FROM employee_contracts WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Contract deleted" });
  });
});


// =======================================
// EMPLOYEE ATTENDANCE
// =======================================

router.get("/:id/attendance", (req, res) => {
  const { start_date, end_date } = req.query;

  let query = "SELECT * FROM employee_attendance WHERE employee_id = ?";
  const params = [req.params.id];

  if (start_date) {
    query += " AND date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    query += " AND date <= ?";
    params.push(end_date);
  }

  query += " ORDER BY date DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/:id/attendance", (req, res) => {
  const { date, clock_in, clock_out, status, notes } = req.body;

  // Calculate hours worked
  let hours_worked = 0;
  let overtime = 0;
  let late_arrival = 0;

  if (clock_in && clock_out) {
    const inTime = new Date("1970-01-01T" + clock_in + "Z");
    const outTime = new Date("1970-01-01T" + clock_out + "Z");
    hours_worked = (outTime - inTime) / (1000 * 60 * 60);

    // Overtime if more than 8 hours
    if (hours_worked > 8) {
      overtime = hours_worked - 8;
    }

    // Late arrival if after 9 AM
    const nineAM = new Date("1970-01-01T09:00:00Z");
    if (inTime > nineAM) {
      late_arrival = 1;
    }
  }

  db.run(
    `INSERT INTO employee_attendance (employee_id, date, clock_in, clock_out, hours_worked, overtime, late_arrival, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, date, clock_in, clock_out, hours_worked, overtime, late_arrival, status || 'present', notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Attendance recorded" });
    }
  );
});

router.put("/attendance/:id", (req, res) => {
  const { clock_in, clock_out, status, notes } = req.body;

  let hours_worked = 0;
  let overtime = 0;
  let late_arrival = 0;

  if (clock_in && clock_out) {
    const inTime = new Date("1970-01-01T" + clock_in + "Z");
    const outTime = new Date("1970-01-01T" + clock_out + "Z");
    hours_worked = (outTime - inTime) / (1000 * 60 * 60);

    if (hours_worked > 8) {
      overtime = hours_worked - 8;
    }

    const nineAM = new Date("1970-01-01T09:00:00Z");
    if (inTime > nineAM) {
      late_arrival = 1;
    }
  }

  db.run(
    `UPDATE employee_attendance SET clock_in=?, clock_out=?, hours_worked=?, overtime=?, late_arrival=?, status=?, notes=? WHERE id=?`,
    [clock_in, clock_out, hours_worked, overtime, late_arrival, status, notes, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Attendance updated" });
    }
  );
});


// =======================================
// EMPLOYEE LEAVE
// =======================================

router.get("/:id/leave", (req, res) => {
  db.all(
    "SELECT * FROM employee_leave WHERE employee_id = ? ORDER BY created_at DESC",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

router.post("/:id/leave", (req, res) => {
  const { leave_type, start_date, end_date, days, notes } = req.body;

  db.run(
    `INSERT INTO employee_leave (employee_id, leave_type, start_date, end_date, days, status, notes)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [req.params.id, leave_type || 'annual', start_date, end_date, days || 0, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Leave request submitted" });
    }
  );
});

router.put("/leave/:id", (req, res) => {
  const { status, approved_by } = req.body;

  db.run(
    `UPDATE employee_leave SET status=?, approved_by=? WHERE id=?`,
    [status, approved_by, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Leave request updated" });
    }
  );
});


// =======================================
// EMPLOYEE PAYROLL
// =======================================

router.get("/:id/payroll", (req, res) => {
  const { period } = req.query;

  let query = "SELECT * FROM employee_payroll WHERE employee_id = ?";
  const params = [req.params.id];

  if (period) {
    query += " AND period = ?";
    params.push(period);
  }

  query += " ORDER BY created_at DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/:id/payroll", (req, res) => {
  const { period, base_salary, overtime, bonuses, deductions, tax } = req.body;

  const net_salary = (base_salary || 0) + (overtime || 0) + (bonuses || 0) - (deductions || 0) - (tax || 0);

  db.run(
    `INSERT INTO employee_payroll (employee_id, period, base_salary, overtime, bonuses, deductions, tax, net_salary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, period, base_salary || 0, overtime || 0, bonuses || 0, deductions || 0, tax || 0, net_salary],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, net_salary, message: "Payroll generated" });
    }
  );
});


// =======================================
// EMPLOYEE DOCUMENTS
// =======================================

router.get("/:id/documents", (req, res) => {
  db.all(
    "SELECT * FROM employee_documents WHERE employee_id = ? ORDER BY created_at DESC",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

router.post("/:id/documents", (req, res) => {
  const { document_name, document_type, file_path, notes } = req.body;

  db.run(
    `INSERT INTO employee_documents (employee_id, document_name, document_type, file_path, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.id, document_name, document_type, file_path, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: "Document added" });
    }
  );
});

router.delete("/documents/:id", (req, res) => {
  db.run("DELETE FROM employee_documents WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Document deleted" });
  });
});


// =======================================
// EMPLOYEE STATISTICS
// =======================================

router.get("/stats", (req, res) => {
  const queries = {
    total: "SELECT COUNT(*) as count FROM employees",
    active: "SELECT COUNT(*) as count FROM employees WHERE status = 'نشط'",
    onLeave: "SELECT COUNT(*) as count FROM employee_leave WHERE status = 'approved' AND date('now') BETWEEN start_date AND end_date",
    totalSalary: "SELECT SUM(monthly_salary) as total FROM employees WHERE status = 'نشط'"
  };

  let results = {};
  let completed = 0;

  Object.entries(queries).forEach(([key, sql]) => {
    db.get(sql, [], (err, row) => {
      if (!err && row) results[key] = row.count || row.total || 0;
      else results[key] = 0;
      completed++;
      if (completed === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});


module.exports = router;