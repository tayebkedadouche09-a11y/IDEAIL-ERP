const db = require("../database");

/**
 * Middleware: Prevent negative stock on "Sortie" movements
 */
function checkStockAvailability(req, res, next) {
  const { product_id, movement_type, quantity } = req.body;

  if (movement_type === "Sortie" || movement_type === "sortie") {
    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Valid product and quantity are required" });
    }

    db.get(
      "SELECT quantity, name FROM products WHERE id = ?",
      [product_id],
      (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ error: "Product not found" });

        if (product.quantity < quantity) {
          return res.status(400).json({
            error: `Insufficient stock. Available: ${product.quantity} ${product.name || ""}`,
            available: product.quantity,
          });
        }
        next();
      }
    );
  } else {
    next();
  }
}

/**
 * Auto-update product quantity after stock movement
 */
function updateProductQuantity(productId, quantity, movementType) {
  const change = movementType === "Entrée" || movementType === "entree" ? quantity : -quantity;

  db.run(
    "UPDATE products SET quantity = quantity + ? WHERE id = ?",
    [change, productId],
    (err) => {
      if (err) console.error("Failed to update product quantity:", err.message);
    }
  );
}

module.exports = {
  checkStockAvailability,
  updateProductQuantity,
};