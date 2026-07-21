const db = require("../../database");

// Calculate quotation cost
function calculateQuotationCost(data) {
  const { materials = [], labor = 0, expenses = 0, transport = 0, equipment = 0, otherCosts = 0 } = data;
  
  const materialCost = materials.reduce((sum, m) => sum + Number(m.total_cost || 0), 0);
  const totalCost = materialCost + Number(labor) + Number(expenses) + Number(transport) + Number(equipment) + Number(otherCosts);
  
  return {
    materialCost,
    laborCost: Number(labor),
    expenseCost: Number(expenses) + Number(transport) + Number(equipment) + Number(otherCosts),
    totalCost,
  };
}

// Apply profit margin
function applyProfitMargin(cost, margin) {
  const profit = cost * (margin / 100);
  return {
    sellingPrice: cost + profit,
    profit,
  };
}

// Calculate VAT
function calculateVAT(amount, vatRate = 19) {
  return Number(amount) * (vatRate / 100);
}

// Calculate final price
function calculateFinalPrice(data) {
  const cost = calculateQuotationCost(data);
  const margin = applyProfitMargin(cost.totalCost, data.margin || 30);
  const vat = calculateVAT(margin.sellingPrice, data.vatRate || 19);
  
  return {
    ...cost,
    ...margin,
    vat,
    finalPrice: margin.sellingPrice + vat,
  };
}

module.exports = {
  calculateQuotationCost,
  applyProfitMargin,
  calculateVAT,
  calculateFinalPrice,
};