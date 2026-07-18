const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "ideail.db");

// إنشاء أو فتح قاعدة البيانات
const db = new sqlite3.Database(dbPath, (err) => {

  if (err) {

    console.error("خطأ في فتح قاعدة البيانات:", err.message);

  } else {

    console.log("✅ تم الاتصال بقاعدة البيانات بنجاح");

  }

});

db.run("PRAGMA foreign_keys = ON", (err) => {
  if (err) {
    console.error("⚠️ Unable to enable foreign keys:", err.message);
  }
});

// إنشاء الجداول
db.serialize(() => {
  // ===============================
// CLIENT TRANSACTIONS
// حسابات العملاء
// ===============================

db.run(`
CREATE TABLE IF NOT EXISTS client_transactions (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    client_id INTEGER NOT NULL,

    project_id INTEGER,

    work_date TEXT,

    description TEXT,

    days_worked REAL DEFAULT 0,

    daily_price REAL DEFAULT 0,

    total_amount REAL DEFAULT 0,

    paid_amount REAL DEFAULT 0,

    notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(client_id) REFERENCES clients(id),

    FOREIGN KEY(project_id) REFERENCES projects(id)

)
`);
// ===============================
// EMPLOYEE EVALUATIONS
// ===============================

db.run(`
CREATE TABLE IF NOT EXISTS employee_evaluations (

id INTEGER PRIMARY KEY AUTOINCREMENT,

employee_id INTEGER NOT NULL,

evaluation_date TEXT DEFAULT CURRENT_DATE,

rating INTEGER DEFAULT 0,

work_quality INTEGER DEFAULT 0,

punctuality INTEGER DEFAULT 0,

discipline INTEGER DEFAULT 0,

absence_days INTEGER DEFAULT 0,

projects_completed INTEGER DEFAULT 0,

notes TEXT,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(employee_id) REFERENCES employees(id)

)
`);
  // ===============================
// EMPLOYEES
// ===============================

db.run(`
CREATE TABLE IF NOT EXISTS employees (

id INTEGER PRIMARY KEY AUTOINCREMENT,

employee_code TEXT UNIQUE,

name TEXT NOT NULL,

phone TEXT,

address TEXT,

job_title TEXT,

specialty TEXT,

salary_type TEXT DEFAULT 'daily',

daily_rate REAL DEFAULT 0,

hourly_rate REAL DEFAULT 0,

monthly_salary REAL DEFAULT 0,

status TEXT DEFAULT 'نشط',

notes TEXT,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP

)
`);

  // ===============================
  // CLIENTS
  // ===============================

  db.run(`
    CREATE TABLE IF NOT EXISTS clients (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,

      phone TEXT,

      email TEXT,

      address TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
  `);



  // ===============================
  // PROJECTS
  // ===============================

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      client_id INTEGER NOT NULL,

      system_id INTEGER,

      name TEXT NOT NULL,

      description TEXT,

      surface_m2 REAL DEFAULT 0,

      start_date TEXT,

      end_date TEXT,

      status TEXT DEFAULT 'جديد',

      amount REAL DEFAULT 0,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (client_id) REFERENCES clients(id),

      FOREIGN KEY (system_id) REFERENCES systems(id)

    )
  `);



  // ===============================
  // INVOICES
  // ===============================

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      client_id INTEGER NOT NULL,

      project_id INTEGER,

      invoice_number TEXT UNIQUE,

      amount REAL DEFAULT 0,

      status TEXT DEFAULT 'غير مدفوعة',

      invoice_date TEXT,

      signature TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (client_id) REFERENCES clients(id),

      FOREIGN KEY (project_id) REFERENCES projects(id)

    )
  `);



  // ===============================
  // PRODUCTS
  // ===============================

  db.run(`
    CREATE TABLE IF NOT EXISTS products (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,

      category TEXT,

      unit TEXT DEFAULT 'kg',

      purchase_price REAL DEFAULT 0,

      sale_price REAL DEFAULT 0,

      quantity REAL DEFAULT 0,

      minimum_quantity REAL DEFAULT 0,

      supplier TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
  `);



  // ===============================
  // SYSTEMS
  // ===============================

  db.run(`
    CREATE TABLE IF NOT EXISTS systems (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,

      type TEXT,

      resin_consumption REAL DEFAULT 0,

      hardener_ratio REAL DEFAULT 0,

      primer_consumption REAL DEFAULT 0,

      sand_consumption REAL DEFAULT 0,

      drying_time TEXT,

      notes TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
  `);



  // ===============================
  // SYSTEM PRODUCTS
  // ===============================

  db.run(`
    CREATE TABLE IF NOT EXISTS system_products (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      system_id INTEGER NOT NULL,

      product_id INTEGER NOT NULL,

      consumption REAL DEFAULT 0,

      FOREIGN KEY(system_id) REFERENCES systems(id),

      FOREIGN KEY(product_id) REFERENCES products(id)

    )
  `);



  // ===============================
  // STOCK MOVEMENTS
  // ===============================

  db.run(`
    CREATE TABLE IF NOT EXISTS stock_movements (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      product_id INTEGER NOT NULL,

      movement_type TEXT NOT NULL,

      quantity REAL NOT NULL,

      reference_id INTEGER,

      notes TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY(product_id) REFERENCES products(id)

    )
  `);



  // ===============================
  // COMPANY INFO
  // ===============================

  db.run(`
    CREATE TABLE IF NOT EXISTS company_info (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      company_name TEXT,

      phone TEXT,

      email TEXT,

      address TEXT,

      rc TEXT,

      nif TEXT,

      nis TEXT,

      logo TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
  `);



  // ===============================
  // ADD MISSING PROJECT COLUMNS
  // ===============================


  db.run(
    `
    ALTER TABLE projects
    ADD COLUMN system_id INTEGER
    `,
    (err) => {

      if (
        err &&
        !err.message.includes("duplicate column")
      ) {

        console.log(
          "system_id:",
          err.message
        );

      }

    }
  );


  db.run(
    `
    ALTER TABLE projects
    ADD COLUMN surface_m2 REAL DEFAULT 0
    `,
    (err) => {

      if (
        err &&
        !err.message.includes("duplicate column")
      ) {

        console.log(
          "surface_m2:",
          err.message
        );

      }

    }
  );


});

// ===============================
// PROJECT MATERIALS
// مواد المشاريع
// ===============================

db.run(`
CREATE TABLE IF NOT EXISTS project_materials (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    project_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    quantity REAL DEFAULT 0,

    unit_price REAL DEFAULT 0,

    total_cost REAL DEFAULT 0,

    notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(project_id) REFERENCES projects(id),

    FOREIGN KEY(product_id) REFERENCES products(id)

)
`);

module.exports = db;
// إضافة معلومات إضافية للعملاء

db.run(`
ALTER TABLE clients
ADD COLUMN client_code TEXT
`, (err)=>{
  if(err && !err.message.includes("duplicate column")){
    console.log(err.message);
  }
});


db.run(`
ALTER TABLE clients
ADD COLUMN company_name TEXT
`, (err)=>{
  if(err && !err.message.includes("duplicate column")){
    console.log(err.message);
  }
});


db.run(`
ALTER TABLE clients
ADD COLUMN status TEXT DEFAULT 'نشط'
`, (err)=>{
  if(err && !err.message.includes("duplicate column")){
    console.log(err.message);
  }
});


db.run(`
ALTER TABLE clients
ADD COLUMN tax_number TEXT
`, (err)=>{
  if(err && !err.message.includes("duplicate column")){
    console.log(err.message);
  }
});
// ===============================
// EMPLOYEES العمال
// ===============================

db.run(`
CREATE TABLE IF NOT EXISTS employees (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    employee_code TEXT UNIQUE,

    name TEXT NOT NULL,

    phone TEXT,

    address TEXT,

    job_title TEXT,

    specialty TEXT,

    salary_type TEXT DEFAULT 'daily',

    daily_rate REAL DEFAULT 0,

    hourly_rate REAL DEFAULT 0,

    monthly_salary REAL DEFAULT 0,

    status TEXT DEFAULT 'نشط',

    notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

)
`);




// ===============================
// PROJECT WORKERS ربط العمال بالمشاريع
// ===============================

db.run(`
CREATE TABLE IF NOT EXISTS project_workers (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    project_id INTEGER NOT NULL,

    employee_id INTEGER NOT NULL,

    start_date TEXT,

    end_date TEXT,

    days_worked REAL DEFAULT 0,

    daily_rate REAL DEFAULT 0,

    total_cost REAL DEFAULT 0,

    notes TEXT,

    FOREIGN KEY(project_id) REFERENCES projects(id),

    FOREIGN KEY(employee_id) REFERENCES employees(id)

)
`);




// ===============================
// EMPLOYEE PAYMENTS دفعات العمال
// ===============================

db.run(`
CREATE TABLE IF NOT EXISTS employee_payments (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    employee_id INTEGER NOT NULL,

    payment_type TEXT,

    amount REAL DEFAULT 0,

    payment_date TEXT,

    notes TEXT,

    FOREIGN KEY(employee_id) REFERENCES employees(id)

)
`);





// ===============================
// EMPLOYEE EVALUATIONS تقييم العمال
// ===============================

db.run(`
CREATE TABLE IF NOT EXISTS employee_evaluations (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    employee_id INTEGER NOT NULL,

    project_id INTEGER,

    quality_score INTEGER DEFAULT 0,

    speed_score INTEGER DEFAULT 0,

    discipline_score INTEGER DEFAULT 0,

    behavior_score INTEGER DEFAULT 0,

    organization_score INTEGER DEFAULT 0,

    total_score REAL DEFAULT 0,

    comments TEXT,

    evaluation_date DATETIME DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(employee_id) REFERENCES employees(id),

    FOREIGN KEY(project_id) REFERENCES projects(id)

)
`);





// ===============================
// EMPLOYEE ATTENDANCE حضور العمال
// ===============================

db.run(`
CREATE TABLE IF NOT EXISTS employee_attendance (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    employee_id INTEGER NOT NULL,

    project_id INTEGER,

    work_date TEXT,

    days REAL DEFAULT 1,

    notes TEXT,

    FOREIGN KEY(employee_id) REFERENCES employees(id),

    FOREIGN KEY(project_id) REFERENCES projects(id)

)
`);