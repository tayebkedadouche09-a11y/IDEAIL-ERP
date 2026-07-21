const express = require("express");
const router = express.Router();
const { askAssistant, getHistory } = require("../services/assistant");

// Ask assistant
router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user?.id;
    
    const response = await askAssistant(question, userId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get history
router.get("/history", async (req, res) => {
  try {
    const userId = req.user?.id;
    const history = await getHistory(userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;