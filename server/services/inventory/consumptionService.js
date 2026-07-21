const db = require("../../database");
const { eventBus } = require("../events");

// Consume material
function consumeMaterial(projectId, productId, quantity) {
  return new Promise((resolve, reject) => {
    // Check if reserved
    db.get(
      `SELECT * FROM project_material_reservations 
       WHERE project_id = ? AND product_id = ? AND status = 'reserved'`,
      [projectId, productId],
      (err, reservation) => {
        if (err) return reject(err);

        // Update stock
        db.run(
          "UPDATE products SET quantity = quantity - ? WHERE id = ?",
          [quantity, productId],
          function (err) {
            if (err) return reject(err);

            // Create consumption record
            db.run(
              `INSERT INTO material_consumptions (project_id, product_id, quantity, consumption_date)
               VALUES (?, ?, ?, date('now'))`,
              [projectId, productId, quantity],
              function (err) {
                if (err) return reject(err);

                // Create stock movement
                db.run(
                  `INSERT INTO stock_movements (product_id, movement_type, quantity, reference, reference_id)
                   VALUES (?, 'consumption', ?, 'project', ?)`,
                  [productId, quantity, projectId],
                  function (err) {
                    if (err) return reject(err);

                    // Update reservation status
                    db.run(
                      "UPDATE project_material_reservations SET status = 'consumed' WHERE id = ?",
                      [reservation?.id],
                      function (err) {
                        if (err) return reject(err);

                        // Emit event
                        eventBus.emit("MaterialConsumed", { projectId, productId, quantity }, db);

                        resolve({ success: true, consumptionId: this.lastID });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
}

// Consume all project materials
function consumeProjectMaterials(projectId) {
  return new Promise(async (resolve, reject) => {
    try {
      const reservations = await new Promise((res, rej) => {
        db.all(
          "SELECT * FROM project_material_reservations WHERE project_id = ? AND status = 'reserved'",
          [projectId],
          (err, rows) => {
            if (err) return rej(err);
            res(rows);
          }
        );
      });

      for (const reservation of reservations) {
        await consumeMaterial(projectId, reservation.product_id, reservation.quantity);
      }

      resolve({ success: true, consumed: reservations.length });
    } catch (error) {
      reject(error);
    }
  });
}

// Calculate material difference
function calculateMaterialDifference(projectId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         pm.product_id,
         p.name as product_name,
         pm.quantity as required,
         COALESCE(SUM(mc.quantity), 0) as consumed,
         (pm.quantity - COALESCE(SUM(mc.quantity), 0)) as difference
       FROM project_materials pm
       JOIN products p ON pm.product_id = p.id
       LEFT JOIN material_consumptions mc ON pm.project_id = mc.project_id AND pm.product_id = mc.product_id
       WHERE pm.project_id = ?
       GROUP BY pm.product_id`,
      [projectId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Calculate material loss
function calculateMaterialLoss(projectId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         pm.product_id,
         p.name as product_name,
         pm.quantity as required,
         COALESCE(SUM(mc.quantity), 0) as consumed,
         (pm.quantity - COALESCE(SUM(mc.quantity), 0)) as loss
       FROM project_materials pm
       JOIN products p ON pm.product_id = p.id
       LEFT JOIN material_consumptions mc ON pm.project_id = mc.project_id AND pm.product_id = mc.product_id
       WHERE pm.project_id = ?
       HAVING loss > 0`,
      [projectId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

module.exports = {
  consumeMaterial,
  consumeProjectMaterials,
  calculateMaterialDifference,
  calculateMaterialLoss,
};