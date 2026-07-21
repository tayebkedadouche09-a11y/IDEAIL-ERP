const db = require("../../database");
const { calculateFinalPrice } = require("./quotationCalculationService");

// Create quotation from calculation
function createQuotationFromCalculation(data) {
  return new Promise((resolve, reject) => {
    const {
      client_id,
      project_id,
      system_id,
      title,
      description,
      materials = [],
      labor = 0,
      expenses = 0,
      transport = 0,
      equipment = 0,
      otherCosts = 0,
      margin = 30,
      vatRate = 19,
    } = data;

    const pricing = calculateFinalPrice({
      materials,
      labor,
      expenses,
      transport,
      equipment,
      otherCosts,
      margin,
      vatRate,
    });

    // Generate quotation number
    const devisNumber = "DEV-" + Date.now();

    db.run(
      `INSERT INTO devis (devis_number, client_id, project_id, title, description, amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [devisNumber, client_id, project_id || null, title, description, pricing.finalPrice, "brouillon"],
      function (err) {
        if (err) return reject(err);

        const devisId = this.lastID;

        // Add quotation items
        const items = [];
        
        // Add materials as items
        materials.forEach((m) => {
          items.push([devisId, m.product_name, m.quantity, m.unit_price, m.total_cost]);
        });

        // Add labor as item
        if (labor > 0) {
          items.push([devisId, "Labor", 1, labor, labor]);
        }

        // Add expenses as item
        if (expenses > 0) {
          items.push([devisId, "Expenses", 1, expenses, expenses]);
        }

        const stmt = db.prepare(
          "INSERT INTO devis_items (devis_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)"
        );

        items.forEach((item) => {
          stmt.run(item);
        });

        stmt.finalize();

        resolve({
          id: devisId,
          devis_number: devisNumber,
          ...pricing,
        });
      }
    );
  });
}

// Create quotation from project
function createQuotationFromProject(projectId, margin = 30) {
  return new Promise(async (resolve, reject) => {
    try {
      // Get project data
      const project = await new Promise((res, rej) => {
        db.get(
          `SELECT p.*, c.name as client_name, s.name as system_name
           FROM projects p
           JOIN clients c ON p.client_id = c.id
           LEFT JOIN systems s ON p.system_id = s.id
           WHERE p.id = ?`,
          [projectId],
          (err, row) => {
            if (err) return rej(err);
            res(row);
          }
        );
      });

      // Get project materials
      const materials = await new Promise((res, rej) => {
        db.all(
          `SELECT pm.*, p.name as product_name
           FROM project_materials pm
           JOIN products p ON pm.product_id = p.id
           WHERE pm.project_id = ?`,
          [projectId],
          (err, rows) => {
            if (err) return rej(err);
            res(rows);
          }
        );
      });

      // Get project workers
      const workers = await new Promise((res, rej) => {
        db.all(
          `SELECT pw.*, e.name as employee_name
           FROM project_workers pw
           JOIN employees e ON pw.employee_id = e.id
           WHERE pw.project_id = ?`,
          [projectId],
          (err, rows) => {
            if (err) return rej(err);
            res(rows);
          }
        );
      });

      // Get project expenses
      const expenses = await new Promise((res, rej) => {
        db.all(
          "SELECT * FROM project_expenses WHERE project_id = ?",
          [projectId],
          (err, rows) => {
            if (err) return rej(err);
            res(rows);
          }
        );
      });

      // Calculate costs
      const materialCost = materials.reduce((sum, m) => sum + Number(m.total_cost || 0), 0);
      const laborCost = workers.reduce((sum, w) => sum + Number(w.total_cost || 0), 0);
      const expenseCost = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const pricing = calculateFinalPrice({
        materials: materials.map((m) => ({
          product_name: m.product_name,
          quantity: m.quantity,
          unit_price: m.unit_price,
          total_cost: m.total_cost,
        })),
        labor: laborCost,
        expenses: expenseCost,
        margin,
      });

      // Create quotation
      const devisNumber = "DEV-" + Date.now();

      db.run(
        `INSERT INTO devis (devis_number, client_id, project_id, title, description, amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [devisNumber, project.client_id, projectId, project.name, project.description, pricing.finalPrice, "brouillon"],
        function (err) {
          if (err) return reject(err);

          const devisId = this.lastID;

          // Add items
          const stmt = db.prepare(
            "INSERT INTO devis_items (devis_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)"
          );

          materials.forEach((m) => {
            stmt.run([devisId, m.product_name, m.quantity, m.unit_price, m.total_cost]);
          });

          if (laborCost > 0) {
            stmt.run([devisId, "Labor", 1, laborCost, laborCost]);
          }

          if (expenseCost > 0) {
            stmt.run([devisId, "Expenses", 1, expenseCost, expenseCost]);
          }

          stmt.finalize();

          resolve({
            id: devisId,
            devis_number: devisNumber,
            ...pricing,
          });
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Add quotation items
function addQuotationItems(devisId, items) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      "INSERT INTO devis_items (devis_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)"
    );

    items.forEach((item) => {
      stmt.run([devisId, item.description, item.quantity, item.unit_price, item.total_price]);
    });

    stmt.finalize((err) => {
      if (err) return reject(err);
      resolve({ success: true });
    });
  });
}

// Get quotation details
function getQuotationDetails(devisId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT d.*, c.name as client_name, p.name as project_name
       FROM devis d
       JOIN clients c ON d.client_id = c.id
       LEFT JOIN projects p ON d.project_id = p.id
       WHERE d.id = ?`,
      [devisId],
      (err, devis) => {
        if (err) return reject(err);

        db.all(
          "SELECT * FROM devis_items WHERE devis_id = ?",
          [devisId],
          (err, items) => {
            if (err) return reject(err);
            resolve({ ...devis, items });
          }
        );
      }
    );
  });
}

module.exports = {
  createQuotationFromCalculation,
  createQuotationFromProject,
  addQuotationItems,
  getQuotationDetails,
};