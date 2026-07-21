const db = require("../../database");
const { analyzeUserQuestion } = require("./queryAnalyzer");
const { generateResponse } = require("./responseGenerator");
const { getLossMakingProjects, getTopProfitableProjects, getBestClients } = require("../ai/businessInsightService");
const { checkLowStock } = require("../inventory/stockAlertService");

// Ask assistant
async function askAssistant(question, userId = null) {
  const analysis = analyzeUserQuestion(question);
  
  let data = [];
  let totalProfit = 0;
  let totalExpenses = 0;
  
  // Get data based on analysis
  if (analysis.category === "projects") {
    if (analysis.intent === "loss_making") {
      data = await getLossMakingProjects(10);
    } else if (analysis.intent === "top_profitable") {
      data = await getTopProfitableProjects(10);
    }
  } else if (analysis.category === "stock") {
    if (analysis.intent === "low_stock") {
      data = await checkLowStock();
    }
  } else if (analysis.category === "clients") {
    if (analysis.intent === "best_clients") {
      data = await getBestClients(10);
    }
  }
  
  // Generate response
  const response = generateResponse(analysis.category, analysis.intent, data);
  
  // Save to history
  if (userId) {
    db.run(
      "INSERT INTO assistant_history (user_id, question, answer) VALUES (?, ?, ?)",
      [userId, question, response.answer]
    );
  }
  
  return {
    ...response,
    analysis,
  };
}

// Get history
function getHistory(userId, limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM assistant_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      [userId, limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

module.exports = {
  askAssistant,
  getHistory,
};