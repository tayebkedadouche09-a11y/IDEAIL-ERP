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

// ===============================
// DATABASE INITIALIZATION
// All tables are created sequentially inside db.serialize()
// to ensure proper execution order.
// ===============================

db.serialize(() => {

  // ===============================
  // USERS TABLE (Authentication)
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    is_active INTEGER DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ===============================
  // CLIENTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_code TEXT,
    company_name TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    contact_person TEXT,
    registration_number TEXT,
    tax_number TEXT,
    nif TEXT,
    nis TEXT,
    rc TEXT,
    payment_terms INTEGER DEFAULT 30,
    credit_limit REAL DEFAULT 0,
    status TEXT DEFAULT 'نشط',
    outstanding REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ===============================
  // COMPANY SETTINGS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS company_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'text',
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // Insert default settings
  db.run("INSERT OR IGNORE INTO company_settings (setting_key, setting_value, setting_type, description) VALUES ('company_name', 'SARL IDEAIL ROUVETMON', 'text', 'Company legal name')");
  db.run("INSERT OR IGNORE INTO company_settings (setting_key, setting_value, setting_type, description) VALUES ('vat_rate', '19', 'number', 'VAT percentage rate')");
  db.run("INSERT OR IGNORE INTO company_settings (setting_key, setting_value, setting_type, description) VALUES ('currency', 'DZD', 'text', 'Default currency code')");
  db.run("INSERT OR IGNORE INTO company_settings (setting_key, setting_value, setting_type, description) VALUES ('invoice_prefix', 'INV', 'text', 'Invoice number prefix')");
  db.run("INSERT OR IGNORE INTO company_settings (setting_key, setting_value, setting_type, description) VALUES ('invoice_start_number', '1', 'number', 'Starting invoice number')");
  db.run("INSERT OR IGNORE INTO company_settings (setting_key, setting_value, setting_type, description) VALUES ('devis_prefix', 'DEV', 'text', 'Devis number prefix')");
  db.run("INSERT OR IGNORE INTO company_settings (setting_key, setting_value, setting_type, description) VALUES ('devis_start_number', '1', 'number', 'Starting devis number')");
  db.run("INSERT OR IGNORE INTO company_settings (setting_key, setting_value, setting_type, description) VALUES ('payment_terms_days', '30', 'number', 'Default payment terms in days')");

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
    website TEXT,
    activity_type TEXT,
    registration_number TEXT,
    tax_number TEXT,
    rc TEXT,
    nif TEXT,
    nis TEXT,
    vat_rate TEXT DEFAULT '19',
    default_currency TEXT DEFAULT 'DZD',
    payment_terms TEXT DEFAULT '30',
    invoice_prefix TEXT DEFAULT 'INV-',
    quote_prefix TEXT DEFAULT 'QUO-',
    language TEXT DEFAULT 'ar',
    theme TEXT DEFAULT 'light',
    date_format TEXT DEFAULT 'dd/mm/yyyy',
    logo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ===============================
  // SUPPLIERS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    contact_person TEXT,
    registration_number TEXT,
    tax_number TEXT,
    nif TEXT,
    nis TEXT,
    rc TEXT,
    payment_terms INTEGER DEFAULT 30,
    credit_limit REAL DEFAULT 0,
    bank_name TEXT,
    bank_account TEXT,
    category TEXT DEFAULT 'materials',
    status TEXT DEFAULT 'نشط',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    email TEXT,
    birth_date TEXT,
    hire_date TEXT,
    department TEXT,
    emergency_contact TEXT,
    national_id TEXT,
    tax_number TEXT,
    social_security_number TEXT,
    photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ===============================
  // EMPLOYEE CONTRACTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS employee_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    contract_type TEXT DEFAULT 'permanent',
    start_date TEXT,
    end_date TEXT,
    salary REAL DEFAULT 0,
    working_hours REAL DEFAULT 0,
    probation_months INTEGER DEFAULT 0,
    contract_pdf TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  )
  `);

  // ===============================
  // EMPLOYEE ATTENDANCE
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS employee_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    clock_in TEXT,
    clock_out TEXT,
    hours_worked REAL DEFAULT 0,
    overtime REAL DEFAULT 0,
    late_arrival INTEGER DEFAULT 0,
    status TEXT DEFAULT 'present',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  )
  `);

  // ===============================
  // EMPLOYEE LEAVE
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS employee_leave (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_type TEXT DEFAULT 'annual',
    start_date TEXT,
    end_date TEXT,
    days INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    approved_by INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  )
  `);

  // ===============================
  // EMPLOYEE PAYROLL
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS employee_payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    period TEXT,
    base_salary REAL DEFAULT 0,
    overtime REAL DEFAULT 0,
    bonuses REAL DEFAULT 0,
    deductions REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    net_salary REAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  )
  `);

  // ===============================
  // EMPLOYEE DOCUMENTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS employee_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    document_name TEXT NOT NULL,
    document_type TEXT,
    file_path TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
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
    category TEXT,
    sector TEXT,
    description TEXT,
    components TEXT,
    layers TEXT,
    consumption TEXT,
    specifications TEXT,
    resin_consumption REAL DEFAULT 0,
    hardener_ratio REAL DEFAULT 0,
    primer_consumption REAL DEFAULT 0,
    sand_consumption REAL DEFAULT 0,
    drying_time TEXT,
    material_cost REAL DEFAULT 0,
    labor_cost REAL DEFAULT 0,
    other_costs REAL DEFAULT 0,
    selling_price REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    min_stock REAL DEFAULT 0,
    supplier TEXT,
    warehouse_id INTEGER,
    location_id INTEGER,
    batch_number TEXT,
    serial_number TEXT,
    expiry_date TEXT,
    average_cost REAL DEFAULT 0,
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
  // STOCK
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    warehouse_id INTEGER,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    min_quantity REAL DEFAULT 0,
    max_quantity REAL DEFAULT 0,
    location TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(warehouse_id) REFERENCES warehouses(id)
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
    material_cost REAL DEFAULT 0,
    labor_cost REAL DEFAULT 0,
    expense_cost REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    profit REAL DEFAULT 0,
    profit_margin REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (system_id) REFERENCES systems(id)
  )
  `);

  // ===============================
  // PROJECT MATERIALS
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

  // ===============================
  // PROJECT WORKERS
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
  // PROJECT EXPENSES
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS project_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount REAL DEFAULT 0,
    expense_date TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )
  `);

  // ===============================
  // PROJECT TIMELINE
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS project_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    event_date TEXT,
    title TEXT NOT NULL,
    description TEXT,
    progress_percent REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )
  `);

  // ===============================
  // PROJECT STATUS HISTORY
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS project_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
  `);

  // ===============================
  // PROJECT DOCUMENTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS project_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    document_name TEXT NOT NULL,
    document_type TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )
  `);

  // ===============================
  // PROJECT MATERIAL RESERVATIONS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS project_material_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    status TEXT DEFAULT 'reserved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
  `);

  // ===============================
  // MATERIAL CONSUMPTIONS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS material_consumptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    consumption_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
  `);

  // ===============================
  // STOCK ALERTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS stock_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    alert_type TEXT,
    message TEXT,
    severity TEXT DEFAULT 'warning',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
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
    devis_id INTEGER,
    invoice_number TEXT UNIQUE,
    amount REAL DEFAULT 0,
    vat_amount REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    invoice_date TEXT,
    signature TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (devis_id) REFERENCES devis(id)
  )
  `);

  // ===============================
  // INVOICE ITEMS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit_price REAL DEFAULT 0,
    total_price REAL DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  )
  `);

  // ===============================
  // DEVIS / QUOTES
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS devis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    devis_number TEXT UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    project_id INTEGER,
    title TEXT,
    description TEXT,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'brouillon',
    valid_until TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )
  `);

  // ===============================
  // DEVIS ITEMS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS devis_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    devis_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit_price REAL DEFAULT 0,
    total_price REAL DEFAULT 0,
    FOREIGN KEY(devis_id) REFERENCES devis(id) ON DELETE CASCADE
  )
  `);

  // ===============================
  // PAYMENTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_type TEXT NOT NULL,
    client_id INTEGER,
    supplier_id INTEGER,
    invoice_id INTEGER,
    amount REAL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    payment_date TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
  )
  `);

  // ===============================
  // EXPENSE CATEGORIES
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ===============================
  // EXPENSES
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    project_id INTEGER,
    supplier_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    amount REAL DEFAULT 0,
    vat_amount REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    expense_date TEXT,
    receipt_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  )
  `);

  // ===============================
  // CASH MOVEMENTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS cash_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movement_type TEXT NOT NULL,
    category TEXT,
    amount REAL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    reference_id INTEGER,
    reference_type TEXT,
    description TEXT,
    movement_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ===============================
  // VAT RECORDS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS vat_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_type TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    total_sales REAL DEFAULT 0,
    total_vat_collected REAL DEFAULT 0,
    total_purchases REAL DEFAULT 0,
    total_vat_paid REAL DEFAULT 0,
    vat_due REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    filed_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ===============================
  // CLIENT TRANSACTIONS
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
  // EMPLOYEE PAYMENTS
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
  // VEHICLES
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT NOT NULL,
    internal_code TEXT,
    brand TEXT,
    model TEXT,
    type TEXT DEFAULT 'truck',
    fuel_type TEXT,
    vin TEXT,
    year INTEGER,
    color TEXT,
    purchase_date TEXT,
    purchase_price REAL DEFAULT 0,
    insurance TEXT,
    technical_inspection TEXT,
    current_mileage REAL DEFAULT 0,
    driver_id INTEGER,
    department TEXT,
    project_id INTEGER,
    insurance_cost REAL DEFAULT 0,
    fuel_budget REAL DEFAULT 0,
    last_service_date TEXT,
    next_service_date TEXT,
    status TEXT DEFAULT 'available',
    notes TEXT,
    photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(driver_id) REFERENCES employees(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )
  `);

  // ===============================
  // VEHICLE FUEL
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS vehicle_fuel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    driver_id INTEGER,
    date TEXT,
    fuel_type TEXT,
    quantity REAL DEFAULT 0,
    unit_price REAL DEFAULT 0,
    fuel_cost REAL DEFAULT 0,
    mileage REAL DEFAULT 0,
    station TEXT,
    invoice_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES employees(id)
  )
  `);

  // ===============================
  // VEHICLE MAINTENANCE
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date TEXT,
    type TEXT,
    garage TEXT,
    cost REAL DEFAULT 0,
    mileage REAL DEFAULT 0,
    next_maintenance TEXT,
    invoice TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  )
  `);

  // ===============================
  // VEHICLE REPAIRS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS vehicle_repairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date TEXT,
    description TEXT,
    parts TEXT,
    labor REAL DEFAULT 0,
    cost REAL DEFAULT 0,
    garage TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  )
  `);

  // ===============================
  // VEHICLE INSURANCE
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS vehicle_insurance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    company TEXT,
    policy_number TEXT,
    start_date TEXT,
    end_date TEXT,
    premium REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  )
  `);

  // ===============================
  // VEHICLE DOCUMENTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS vehicle_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    document_name TEXT NOT NULL,
    document_type TEXT,
    file_path TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  )
  `);

  // ===============================
  // DOCUMENTS
  // ===============================

  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'projects',
      type TEXT DEFAULT 'photo',
      project_id INTEGER,
      client_id INTEGER,
      supplier_id INTEGER,
      employee_id INTEGER,
      invoice_id INTEGER,
      quotation_id INTEGER,
      file_path TEXT,
      file_type TEXT,
      file_size INTEGER DEFAULT 0,
      version INTEGER DEFAULT 1,
      description TEXT,
      status TEXT DEFAULT 'active',
      uploaded_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(client_id) REFERENCES clients(id),
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY(employee_id) REFERENCES employees(id),
      FOREIGN KEY(invoice_id) REFERENCES invoices(id),
      FOREIGN KEY(quotation_id) REFERENCES devis(id)
  )
  `);

  // Upgrade databases created before document versioning and additional links.
  // SQLite has no ADD COLUMN IF NOT EXISTS; duplicate-column errors are harmless.
  [
    "ALTER TABLE documents ADD COLUMN employee_id INTEGER",
    "ALTER TABLE documents ADD COLUMN invoice_id INTEGER",
    "ALTER TABLE documents ADD COLUMN quotation_id INTEGER",
    "ALTER TABLE documents ADD COLUMN version INTEGER DEFAULT 1",
  ].forEach((migration) => db.run(migration, () => {}));

  // ===============================
  // CALCULATIONS
  // ===============================

  // Enterprise extensions.  These entities intentionally use explicit
  // relationships so accounting, procurement, operations and portals share
  // the same ERP database rather than isolated feature stores.
  db.run(`CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT UNIQUE,
    tax_number TEXT, currency TEXT DEFAULT 'DZD', address TEXT, phone TEXT, email TEXT,
    status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL, name TEXT NOT NULL,
    code TEXT, address TEXT, manager_id INTEGER, status TEXT DEFAULT 'active',
    FOREIGN KEY(company_id) REFERENCES companies(id), FOREIGN KEY(manager_id) REFERENCES employees(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
    account_type TEXT NOT NULL, parent_id INTEGER, opening_balance REAL DEFAULT 0,
    active INTEGER DEFAULT 1, FOREIGN KEY(parent_id) REFERENCES chart_of_accounts(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS financial_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, start_date TEXT NOT NULL,
    end_date TEXT NOT NULL, status TEXT DEFAULT 'open'
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, entry_number TEXT UNIQUE, entry_date TEXT NOT NULL,
    reference TEXT, description TEXT, period_id INTEGER, status TEXT DEFAULT 'draft',
    created_by INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(period_id) REFERENCES financial_periods(id), FOREIGN KEY(created_by) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT, journal_entry_id INTEGER NOT NULL, account_id INTEGER NOT NULL,
    description TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0,
    FOREIGN KEY(journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY(account_id) REFERENCES chart_of_accounts(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS purchase_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, request_number TEXT UNIQUE, requester_id INTEGER,
    department TEXT, request_date TEXT, required_date TEXT, status TEXT DEFAULT 'draft',
    notes TEXT, FOREIGN KEY(requester_id) REFERENCES employees(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT, asset_code TEXT UNIQUE, name TEXT NOT NULL,
    category TEXT, purchase_date TEXT, purchase_value REAL DEFAULT 0, useful_life_months INTEGER,
    depreciation_method TEXT DEFAULT 'straight_line', location TEXT, responsible_employee_id INTEGER,
    status TEXT DEFAULT 'active', FOREIGN KEY(responsible_employee_id) REFERENCES employees(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS quality_inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT, inspection_number TEXT UNIQUE, subject_type TEXT NOT NULL,
    subject_id INTEGER, inspection_date TEXT, inspector_id INTEGER, status TEXT DEFAULT 'planned',
    result TEXT, defects TEXT, corrective_action TEXT,
    FOREIGN KEY(inspector_id) REFERENCES employees(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS bills_of_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, version TEXT DEFAULT '1',
    quantity REAL DEFAULT 1, status TEXT DEFAULT 'active', notes TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS production_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, order_number TEXT UNIQUE, product_id INTEGER NOT NULL,
    bom_id INTEGER, planned_quantity REAL DEFAULT 0, completed_quantity REAL DEFAULT 0,
    start_date TEXT, due_date TEXT, status TEXT DEFAULT 'draft',
    FOREIGN KEY(product_id) REFERENCES products(id), FOREIGN KEY(bom_id) REFERENCES bills_of_materials(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, company_name TEXT, email TEXT, phone TEXT,
    source TEXT, stage TEXT DEFAULT 'new', estimated_value REAL DEFAULT 0, owner_id INTEGER, notes TEXT,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, project_id INTEGER,
    assignee_id INTEGER, priority TEXT DEFAULT 'medium', due_date TEXT, status TEXT DEFAULT 'pending',
    FOREIGN KEY(project_id) REFERENCES projects(id), FOREIGN KEY(assignee_id) REFERENCES employees(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, leader_id INTEGER, department TEXT, notes TEXT,
    FOREIGN KEY(leader_id) REFERENCES employees(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, contract_number TEXT UNIQUE, title TEXT NOT NULL, contract_type TEXT,
    client_id INTEGER, supplier_id INTEGER, employee_id INTEGER, start_date TEXT, end_date TEXT,
    value REAL DEFAULT 0, status TEXT DEFAULT 'draft', terms TEXT,
    FOREIGN KEY(client_id) REFERENCES clients(id), FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY(employee_id) REFERENCES employees(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS report_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, data_source TEXT NOT NULL,
    fields_json TEXT, filters_json TEXT, sort_json TEXT, created_by INTEGER,
    FOREIGN KEY(created_by) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, entity_type TEXT NOT NULL,
    definition_json TEXT NOT NULL, active INTEGER DEFAULT 1
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL,
    step_name TEXT, approver_id INTEGER, status TEXT DEFAULT 'pending', comments TEXT, decided_at TEXT,
    FOREIGN KEY(approver_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS portal_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, portal_type TEXT NOT NULL, requester_name TEXT NOT NULL,
    requester_email TEXT, subject TEXT NOT NULL, message TEXT, status TEXT DEFAULT 'open',
    related_project_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(related_project_id) REFERENCES projects(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id INTEGER, vehicle_id INTEGER, title TEXT NOT NULL,
    due_date TEXT, interval_days INTEGER, cost REAL DEFAULT 0, status TEXT DEFAULT 'scheduled', notes TEXT,
    FOREIGN KEY(asset_id) REFERENCES assets(id), FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  )`);

  db.run(`
    CREATE TABLE IF NOT EXISTS calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      system_id INTEGER,
      client_id INTEGER,
      project_id INTEGER,
      surface REAL DEFAULT 0,
      thickness REAL DEFAULT 0,
      labor_cost REAL DEFAULT 0,
      transport REAL DEFAULT 0,
      equipment REAL DEFAULT 0,
      external_services REAL DEFAULT 0,
      other_costs REAL DEFAULT 0,
      margin REAL DEFAULT 30,
      waste_percentage REAL DEFAULT 5,
      vat_rate REAL DEFAULT 20,
      total_cost REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      final_price REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(system_id) REFERENCES systems(id),
      FOREIGN KEY(client_id) REFERENCES clients(id),
      FOREIGN KEY(project_id) REFERENCES projects(id)
  )
  `);

  // ===============================
  // PURCHASE ORDERS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number TEXT UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    order_date TEXT,
    expected_date TEXT,
    status TEXT DEFAULT 'draft',
    subtotal REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL DEFAULT 0,
    currency TEXT DEFAULT 'DZD',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  )
  `);

  // ===============================
  // PURCHASE ORDER ITEMS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL,
    product_id INTEGER,
    description TEXT,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    unit_price REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL DEFAULT 0,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
  `);

  // ===============================
  // GOODS RECEIPTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS goods_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER,
    supplier_id INTEGER,
    receipt_date TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  )
  `);

  // ===============================
  // GOODS RECEIPT ITEMS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS goods_receipt_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goods_receipt_id INTEGER NOT NULL,
    product_id INTEGER,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    notes TEXT,
    FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
  `);

  // ===============================
  // SUPPLIER INVOICES
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS supplier_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    purchase_order_id INTEGER,
    invoice_number TEXT,
    invoice_date TEXT,
    due_date TEXT,
    amount REAL DEFAULT 0,
    vat_amount REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
  )
  `);

  // ===============================
  // SUPPLIER PAYMENTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS supplier_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    supplier_invoice_id INTEGER,
    amount REAL DEFAULT 0,
    payment_date TEXT,
    payment_method TEXT DEFAULT 'cash',
    reference_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (supplier_invoice_id) REFERENCES supplier_invoices(id)
  )
  `);

  // ===============================
  // WAREHOUSES
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    manager TEXT,
    phone TEXT,
    email TEXT,
    capacity REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ===============================
  // WAREHOUSE LOCATIONS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS warehouse_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_id INTEGER,
    code TEXT,
    name TEXT,
    aisle TEXT,
    shelf TEXT,
    bin TEXT,
    capacity REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
  )
  `);

  // ===============================
  // STOCK TRANSFERS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS stock_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    from_warehouse_id INTEGER,
    to_warehouse_id INTEGER,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    transfer_date TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id)
  )
  `);

  // ===============================
  // STOCK ADJUSTMENTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS stock_adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    warehouse_id INTEGER,
    location_id INTEGER,
    quantity_change REAL DEFAULT 0,
    reason TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (location_id) REFERENCES warehouse_locations(id)
  )
  `);

  // ===============================
  // INVENTORY BATCHES
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS inventory_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    batch_number TEXT,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    expiry_date TEXT,
    purchase_price REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
  `);

  // ===============================
  // INVENTORY SERIALS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS inventory_serials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    serial_number TEXT,
    status TEXT DEFAULT 'available',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
  `);

  // ===============================
  // CALENDAR EVENTS TABLE
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_code TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    event_date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    type TEXT DEFAULT 'general',
    project_id INTEGER,
    client_id INTEGER,
    employee_id INTEGER,
    status TEXT DEFAULT 'planned',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  )
  `);

  // ===============================
  // EVENTS TABLE
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    event_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ===============================
  // NOTIFICATIONS TABLE
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ===============================
  // AI INSIGHTS
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS ai_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    title TEXT,
    description TEXT,
    severity TEXT,
    related_entity TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ===============================
  // ASSISTANT HISTORY
  // ===============================

  db.run(`
  CREATE TABLE IF NOT EXISTS assistant_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    question TEXT,
    answer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
  `);

  // ===============================
  // AUTOMATION LOGS
  // ===============================
  
  db.run(`
  CREATE TABLE IF NOT EXISTS automation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_name TEXT,
    status TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);
  
  // ===============================
  // AUDIT LOGS
  // ===============================
  
  db.run(`
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
  `);
  
  // ===============================
  // DEFAULT ADMIN USER
  // ===============================

  db.get("SELECT COUNT(*) AS count FROM users", [], (err, row) => {
    if (!err && row && row.count === 0) {
      const bcryptjs = require("bcryptjs");
      const hashedPassword = bcryptjs.hashSync("admin123", 10);
      db.run(
        "INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)",
        ["admin", "admin@ideail.com", hashedPassword, "Administrator", "admin"]
      );
      console.log("✅ Default admin user created (admin / admin123)");
    }
  });

  console.log("✅ All database tables initialized successfully");

});

module.exports = db;
