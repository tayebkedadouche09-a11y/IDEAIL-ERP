
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const productsRoutes = require("./routes/products");
const db = require("./database");
const systemProductsRoutes = require("./routes/systemProducts");
const clientsRoutes = require("./routes/clients");
const authRoutes = require("./routes/auth");
const { authenticateToken, authorizeRoles } = require("./middleware/auth");
const projectsRoutes = require("./routes/projects");
const invoicesRoutes = require("./routes/invoices");
const systemsRoutes = require("./routes/systems");
const calculatorRoutes = require("./routes/calculator");
const pdfRoutes = require("./routes/pdf");
const app = express();
const stockRoutes = require("./routes/stock");
const employeeEvaluationsRoutes =
require("./routes/employeeEvaluations");
// ======================
// Middleware
// ======================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// مشاركة مجلد الصور

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);


// ======================
// Routes
// ======================
app.use("/auth", authRoutes);
const employeesRoutes = require("./routes/employees");
const companyRouter = require("./routes/company");

app.use(
  "/employee-evaluations",
  authenticateToken,
  authorizeRoles("ADMIN"),
  employeeEvaluationsRoutes
);
app.use(
  "/pdf",
  authenticateToken,
  authorizeRoles("ADMIN", "USER"),
  pdfRoutes
);
app.use(
  "/clients",
  authenticateToken,
  authorizeRoles("ADMIN", "USER"),
  clientsRoutes
);
app.use(
  "/employees",
  authenticateToken,
  authorizeRoles("ADMIN"),
  employeesRoutes
);
app.use(
  "/company",
  authenticateToken,
  authorizeRoles("ADMIN"),
  companyRouter
);
app.use(
  "/projects",
  authenticateToken,
  authorizeRoles("ADMIN", "USER"),
  projectsRoutes
);
app.use(
  "/stock",
  authenticateToken,
  authorizeRoles("ADMIN", "USER"),
  stockRoutes
);
app.use(
  "/invoices",
  authenticateToken,
  authorizeRoles("ADMIN", "USER"),
  invoicesRoutes
);
app.use(
  "/project-materials",
  authenticateToken,
  authorizeRoles("ADMIN", "USER"),
  require("./routes/projectMaterials")
);
app.use(
  "/systems",
  authenticateToken,
  authorizeRoles("ADMIN", "USER"),
  systemsRoutes
);
app.use(
  "/products",
  authenticateToken,
  authorizeRoles("ADMIN", "USER"),
  productsRoutes
);
app.use(
  "/system-products",
  authenticateToken,
  authorizeRoles("ADMIN", "USER"),
  systemProductsRoutes
);
app.use(
  "/calculator",
  authenticateToken,
  authorizeRoles("ADMIN", "USER"),
  calculatorRoutes
);

// ======================
// Dashboard
// ======================

app.get("/dashboard", (req, res) => {


  db.get(
    "SELECT COUNT(*) AS count FROM clients",
    [],
    (err, clients) => {


      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }


      db.get(
        "SELECT COUNT(*) AS count FROM projects",
        [],
        (err, projects) => {


          if (err) {
            return res.status(500).json({
              error: err.message
            });
          }



          db.get(
            "SELECT COUNT(*) AS count FROM invoices",
            [],
            (err, invoices) => {


              if (err) {
                return res.status(500).json({
                  error: err.message
                });
              }



              res.json({

                clients: clients.count,

                projects: projects.count,

                invoices: invoices.count,

              });



            }
          );



        }
      );



    }
  );



});




// ======================
// الصفحة الرئيسية
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

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {

  console.log(
    `🚀 IDEAIL ERP Server running on http://localhost:${PORT}`
  );

});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});