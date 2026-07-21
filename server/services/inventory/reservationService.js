const db = require("../../database");
const { eventBus } = require("../events");

// Reserve material for a project
function reserveMaterial(projectId, productId, quantity) {
  return new Promise((resolve, reject) => {
    // Check availability
    db.get(
      "SELECT quantity FROM products WHERE id = ?",
      [productId],
      (err, product) => {
        if (err) return reject(err);
        if (!product) return reject(new Error("Product not found"));

        // Check if enough stock
        const available = Number(product.quantity || 0);
        if (available < Number(quantity)) {
          return reject(new Error("Insufficient stock"));
        }

        // Create reservation
        db.run(
          `INSERT INTO project_material_reservations (project_id, product_id, quantity, status)
           VALUES (?, ?, ?, 'reserved')`,
          [projectId, productId, quantity],
          function (err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, success: true });
          }
        );
      }
    );
  });
}

// Reserve all project materials
function reserveProjectMaterials(projectId, materials) {
  return new Promise(async (resolve, reject) => {
    try {
      const reservations = [];
      
      for (const material of materials) {
        const result = await reserveMaterial(
          projectId,
          material.product_id,
          material.quantity
        );
        reservations.push(result);
      }

      // Emit event
      eventBus.emit("MaterialsReserved", { projectId, reservations }, db);

      resolve({ success: true, reservations });
    } catch (error) {
      reject(error);
    }
  });
}

// Check material availability
function checkMaterialAvailability(productId, quantity) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT p.quantity, 
              COALESCE(SUM(pmr.quantity), 0) as reserved
       FROM products p
       LEFT JOIN project_material_reservations pmr ON p.id = pmr.product_id AND pmr.status = 'reserved'
       WHERE p.id = ?
       GROUP BY p.id`,
      [productId],
      (err, row) => {
        if (err) return reject(err);
        
        const available = Number(row?.quantity || 0) - Number(row?.reserved || 0);
        resolve({
          available,
          requested: Number(quantity),
          sufficient: available >= Number(quantity),
        });
      }
    );
  });
}

// Release reservation
function releaseReservation(projectId) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE project_material_reservations SET status = 'released' WHERE project_id = ? AND status = 'reserved'",
      [projectId],
      function (err) {
        if (err) return reject(err);
        resolve({ success: true, released: this.changes });
      }
    );
  });
}

// Get project reservations
function getProjectReservations(projectId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT pmr.*, p.name as product_name
       FROM project_material_reservations pmr
       JOIN products p ON pmr.product_id = p.id
       WHERE pmr.project_id = ?`,
      [projectId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

module.exports = {
  reserveMaterial,
  reserveProjectMaterials,
  checkMaterialAvailability,
  releaseReservation,
  getProjectReservations,
};