
const path = require("path");
const express = require("express");
const cors = require("cors");
const productsRoutes = require("./routes/products");
const db = require("./database");
const systemProductsRoutes = require("./routes/systemProducts");
const clientsRoutes = require("./routes/clients");
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
app.use(
"/employee-evaluations",
employeeEvaluationsRoutes
);
app.use("/pdf", pdfRoutes);
app.use("/clients", clientsRoutes);
const employeesRoutes = require("./routes/employees");
const companyRouter = require("./routes/company");
app.use("/employees", employeesRoutes);
app.use("/company", companyRouter);
app.use("/projects", projectsRoutes);
app.use("/stock", stockRoutes);
app.use("/invoices", invoicesRoutes);
app.use(
 "/project-materials",
 require("./routes/projectMaterials")
);
app.use("/systems", systemsRoutes);

app.use("/products", productsRoutes);

app.use("/system-products", systemProductsRoutes);

app.use("/calculator", calculatorRoutes);

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



// ======================

const PORT = 3000;


app.listen(PORT, () => {

  console.log(
    `🚀 IDEAIL ERP Server running on http://localhost:${PORT}`
  );

});