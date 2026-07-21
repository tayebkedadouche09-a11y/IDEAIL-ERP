require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const db = require("./database");
const { authenticateToken } = require("./middleware/auth");

// Import routes
const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const systemProductsRoutes = require("./routes/systemProducts");
const clientsRoutes = require("./routes/clients");
const projectsRoutes = require("./routes/projects");
const invoicesRoutes = require("./routes/invoices");
const systemsRoutes = require("./routes/system");
const calculatorRoutes = require("./routes/calculator");
const pdfRoutes = require("./routes/pdf");
const stockRoutes = require("./routes/stock");
const employeeEvaluationsRoutes = require("./routes/employeeEvaluations");
const employeesRoutes = require("./routes/employees");
const companyRouter = require("./routes/company");
const projectMaterialsRoutes = require("./routes/projectMaterials");
const projectExpensesRoutes = require("./routes/projectExpenses");
const dashboardRoutes = require("./routes/dashboard");
const devisRoutes = require("./routes/devis");
const reportsRoutes = require("./routes/reports");
const financialRoutes = require("./routes/financial");
const profitabilityRoutes = require("./routes/profitability");
const calculationRoutes = require("./routes/calculation");
const inventoryRoutes = require("./routes/inventory");
const aiRoutes = require("./routes/ai");
const assistantRoutes = require("./routes/assistant");
const automationRoutes = require("./routes/automation");
const vehiclesRoutes = require("./routes/vehicles");
const documentsRoutes = require("./routes/documents");
const calendarRoutes = require("./routes/calendar");
const backupRoutes = require("./routes/backup");
const searchRoutes = require("./routes/search");
const auditRoutes = require("./routes/audit");
const suppliersRoutes = require("./routes/suppliers");

// Import services
const { eventBus } = require("./services/events");
const { notificationService } = require("./services/notification");

const app = express();

// CORS Configuration - restrict to frontend origin
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Serve uploads directory
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ======================
// Public Routes (No Auth Required)
// ======================

app.get("/", (req, res) => {
  res.json({
    company: "SARL IDEAIL ROUVETMON",
    project: "IDEAIL ERP",
    status: "Server is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "IDEAIL ERP API",
  });
});

// ======================
// Rate Limiting for Auth
// ======================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Auth routes (login is public, register/me are protected internally)
app.use("/auth", authLimiter, authRoutes);

// ======================
// Protected Routes (Auth Required)
// ======================

app.use("/clients", authenticateToken, clientsRoutes);
app.use("/projects", authenticateToken, projectsRoutes);
app.use("/invoices", authenticateToken, invoicesRoutes);
app.use("/products", authenticateToken, productsRoutes);
app.use("/systems", authenticateToken, systemsRoutes);
app.use("/system-products", authenticateToken, systemProductsRoutes);
app.use("/stock", authenticateToken, stockRoutes);
app.use("/employees", authenticateToken, employeesRoutes);
app.use("/employee-evaluations", authenticateToken, employeeEvaluationsRoutes);
app.use("/company", authenticateToken, companyRouter);
app.use("/project-materials", authenticateToken, projectMaterialsRoutes);
app.use("/project-expenses", authenticateToken, projectExpensesRoutes);
app.use("/calculator", authenticateToken, calculatorRoutes);
app.use("/pdf", authenticateToken, pdfRoutes);

// ======================
// Dashboard (Protected)
// ======================

app.use("/devis", authenticateToken, devisRoutes);
app.use("/dashboard", authenticateToken, dashboardRoutes);
app.use("/reports", authenticateToken, reportsRoutes);
app.use("/financial", authenticateToken, financialRoutes);
app.use("/profitability", authenticateToken, profitabilityRoutes);
app.use("/calculation", authenticateToken, calculationRoutes);
app.use("/inventory", authenticateToken, inventoryRoutes);
app.use("/ai", authenticateToken, aiRoutes);
app.use("/assistant", authenticateToken, assistantRoutes);
app.use("/automation", authenticateToken, automationRoutes);
app.use("/vehicles", authenticateToken, vehiclesRoutes);
app.use("/documents", authenticateToken, documentsRoutes);
app.use("/calendar", authenticateToken, calendarRoutes);
app.use("/backup", authenticateToken, backupRoutes);
app.use("/search", authenticateToken, searchRoutes);
app.use("/audit", authenticateToken, auditRoutes);
app.use("/suppliers", authenticateToken, suppliersRoutes);

// Initialize Automation Scheduler
const { initScheduler } = require("./services/automation");
initScheduler();

// ======================
// Notification Routes
// ======================

app.get("/notifications", authenticateToken, (req, res) => {
  const { notificationService } = require("./services/notification");
  notificationService.getNotifications(db, (err, notifications) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(notifications);
  });
});

app.get("/notifications/unread", authenticateToken, (req, res) => {
  const { notificationService } = require("./services/notification");
  notificationService.getUnreadNotifications(db, (err, notifications) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(notifications);
  });
});

app.get("/notifications/count", authenticateToken, (req, res) => {
  const { notificationService } = require("./services/notification");
  db.get(
    "SELECT COUNT(*) as unread FROM notifications WHERE is_read = 0",
    [],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ unread: result.unread });
    }
  );
});

app.put("/notifications/:id/read", authenticateToken, (req, res) => {
  const { notificationService } = require("./services/notification");
  notificationService.markAsRead(db, req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.put("/notifications/read-all", authenticateToken, (req, res) => {
  db.run("UPDATE notifications SET is_read = 1", [], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete("/notifications/:id", authenticateToken, (req, res) => {
  db.run("DELETE FROM notifications WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ======================
// Server Start
// ======================

const PORT = process.env.PORT || 3000;

// Initialize Event Bus
eventBus.init(db);

app.listen(PORT, () => {
  console.log(
    `🚀 IDEAIL ERP Server running on http://localhost:${PORT}`
  );
  console.log("==========================================");
  console.log("✅ DEFAULT ADMIN CREDENTIALS");
  console.log("==========================================");
  console.log("📧 Email: admin@ideail.com");
  console.log("🔑 Password: admin123");
  console.log("==========================================");
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log("==========================================");
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});