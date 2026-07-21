// Calculate selling price
function calculateSellingPrice(cost, margin) {
  const profit = cost * (margin / 100);
  return cost + profit;
}

// Calculate profit
function calculateProfit(cost, sellingPrice) {
  return sellingPrice - cost;
}

// Calculate margin percentage
function calculateMargin(cost, sellingPrice) {
  if (sellingPrice <= 0) return 0;
  return ((sellingPrice - cost) / sellingPrice) * 100;
}

// Calculate full pricing
function calculateFullPricing(materials, laborCost = 0, otherCosts = 0, margin = 30) {
  const totalCost = materials.reduce((sum, m) => sum + Number(m.total_cost || 0), 0) + laborCost + otherCosts;
  const sellingPrice = calculateSellingPrice(totalCost, margin);
  const profit = calculateProfit(totalCost, sellingPrice);
  const marginPercent = calculateMargin(totalCost, sellingPrice);
  
  return {
    totalCost,
    sellingPrice,
    profit,
    margin: marginPercent,
  };
}

module.exports = {
  calculateSellingPrice,
  calculateProfit,
  calculateMargin,
  calculateFullPricing,
};