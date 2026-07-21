const db = require("../../database");

// Get system materials
function getSystemMaterials(systemId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        sp.id,
        sp.system_id,
        sp.product_id,
        sp.consumption AS consumption_rate,
        p.name as product_name,
        p.unit,
        p.purchase_price,
        p.sale_price
      FROM system_products sp
      JOIN products p ON sp.product_id = p.id
      WHERE sp.system_id = ?
    `;
    db.all(sql, [systemId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Calculate material requirement
function calculateMaterialRequirement(systemId, surface) {
  return new Promise(async (resolve, reject) => {
    try {
      const systemMaterials = await getSystemMaterials(systemId);
      
      const materials = systemMaterials.map((sm) => {
        const requiredQuantity = Number(surface) * Number(sm.consumption_rate || 0);
        const wasteQuantity = requiredQuantity * (Number(sm.waste_percentage || 5) / 100);
        const finalQuantity = requiredQuantity + wasteQuantity;
        const totalCost = finalQuantity * Number(sm.purchase_price || 0);
        
        return {
          product_id: sm.product_id,
          product_name: sm.product_name,
          quantity: finalQuantity.toFixed(2),
          unit: sm.unit || "kg",
          unit_price: sm.purchase_price || 0,
          total_cost: totalCost.toFixed(2),
        };
      });
      
      const totalCost = materials.reduce((sum, m) => sum + Number(m.total_cost), 0);
      
      resolve({
        materials,
        totalCost,
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Calculate waste
function calculateWaste(quantity, percentage) {
  return Number(quantity) * (Number(percentage) / 100);
}

// Calculate material cost
function calculateMaterialCost(materials) {
  return materials.reduce((sum, m) => sum + Number(m.total_cost || 0), 0);
}

// Calculate system cost
async function calculateSystemCost(systemId, surface, wastePercentage = 5) {
  try {
    const system = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM systems WHERE id = ?", [systemId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
    
    const materials = await calculateMaterialRequirement(systemId, surface);
    
    return {
      system,
      surface,
      materials: materials.materials,
      totalMaterialCost: materials.totalCost,
    };
  } catch (error) {
    throw error;
  }
}

// Get system calculation summary
async function getSystemCalculationSummary(systemId, surface, wastePercentage = 5) {
  try {
    const result = await calculateSystemCost(systemId, surface, wastePercentage);
    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getSystemMaterials,
  calculateMaterialRequirement,
  calculateWaste,
  calculateMaterialCost,
  calculateSystemCost,
  getSystemCalculationSummary,
};