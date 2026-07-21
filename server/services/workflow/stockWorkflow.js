// =======================================
// STOCK WORKFLOW SERVICE
// =======================================

/**
 * Consume material for project
 * @param {object} db - Database connection
 * @param {number} projectId - Project ID
 * @param {number} productId - Product ID
 * @param {number} quantity - Quantity to consume
 * @param {function} callback - Callback function
 */
function consumeMaterial(db, projectId, productId, quantity, callback) {
  // Check current stock
  db.get(
    "SELECT quantity, name FROM products WHERE id = ?",
    [productId],
    (err, product) => {
      if (err) return callback(err);
      if (!product) return callback(new Error("Product not found"));
      
      if (product.quantity < quantity) {
        return callback(new Error(`Insufficient stock. Available: ${product.quantity}, Required: ${quantity}`));
      }
      
      // Update stock
      db.run(
        "UPDATE products SET quantity = quantity - ? WHERE id = ?",
        [quantity, productId],
        function(updateErr) {
          if (updateErr) return callback(updateErr);
          
          // Create stock movement
          db.run(
            `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [productId, "consumption", -quantity, projectId, `Consumed for project ${projectId}`],
            (movementErr) => {
              if (movementErr) console.error("Error creating stock movement:", movementErr.message);
            }
          );
          
          callback(null, { success: true, remaining: product.quantity - quantity });
        }
      );
    }
  );
}

/**
 * Check stock level and return alerts
 * @param {object} db - Database connection
 * @param {function} callback - Callback function
 */
function checkStockLevels(db, callback) {
  db.all(
    `SELECT id, name, quantity, minimum_quantity,
            CASE 
              WHEN quantity = 0 THEN 'critical'
              WHEN quantity < minimum_quantity THEN 'warning'
              ELSE 'ok'
            END as status
     FROM products 
     WHERE quantity <= minimum_quantity 
     ORDER BY quantity ASC`,
    [],
    callback
  );
}

/**
 * Create stock movement
 * @param {object} db - Database connection
 * @param {object} movementData - Movement data
 * @param {function} callback - Callback function
 */
function createStockMovement(db, movementData, callback) {
  const {
    product_id,
    movement_type,
    quantity,
    reference_id,
    notes
  } = movementData;
  
  db.run(
    `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [product_id, movement_type, quantity, reference_id, notes],
    function(err) {
      if (err) return callback(err);
      
      // Update product quantity
      const adjustment = movement_type === "in" ? quantity : -quantity;
      db.run(
        "UPDATE products SET quantity = quantity + ? WHERE id = ?",
        [adjustment, product_id],
        (updateErr) => {
          if (updateErr) console.error("Error updating product quantity:", updateErr.message);
        }
      );
      
      callback(null, { success: true, movementId: this.lastID });
    }
  );
}

/**
 * Add material to project
 * @param {object} db - Database connection
 * @param {number} projectId - Project ID
 * @param {object} materialData - Material data
 * @param {function} callback - Callback function
 */
function addProjectMaterial(db, projectId, materialData, callback) {
  const {
    product_id,
    quantity,
    unit_price
  } = materialData;
  
  const total_cost = Number(quantity || 0) * Number(unit_price || 0);
  
  db.run(
    `INSERT INTO project_materials (project_id, product_id, quantity, unit_price, total_cost)
     VALUES (?, ?, ?, ?, ?)`,
    [projectId, product_id, quantity, unit_price, total_cost],
    function(err) {
      if (err) return callback(err);
      
      // Consume stock
      consumeMaterial(db, projectId, product_id, quantity, (consumeErr) => {
        if (consumeErr) console.error("Error consuming material:", consumeErr.message);
      });
      
      callback(null, { success: true, materialId: this.lastID, total_cost });
    }
  );
}

module.exports = {
  consumeMaterial,
  checkStockLevels,
  createStockMovement,
  addProjectMaterial
};