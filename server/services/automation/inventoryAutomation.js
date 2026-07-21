const db = require("../../database");
const { eventBus } = require("../events");

// Check low stock
function checkLowStock() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         p.id,
         p.name,
         p.quantity,
         p.min_stock
       FROM products p
       WHERE p.quantity < p.min_stock`,
      [],
      (err, products) => {
        if (err) return reject(err);
        
        products.forEach((product) => {
          eventBus.emit("LowStockAlert", { productId: product.id, product: product.name }, db);
        });
        
        resolve(products);
      }
    );
  });
}

module.exports = {
  checkLowStock,
};