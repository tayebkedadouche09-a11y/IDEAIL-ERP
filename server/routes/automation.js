const express = require("express");
const router = express.Router();
const {
  runDailyJobs,
  runWeeklyJobs,
  runMonthlyJobs,
  runBackup,
  getStatus,
  getLogs,
} = require("../services/automation");

// Get automation status
router.get("/status", async (req, res) => {
  try {
    const status = await getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get automation logs
router.get("/logs", async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run daily jobs
router.post("/run/daily", async (req, res) => {
  try {
    await runDailyJobs();
    res.json({ success: true, message: "Daily jobs executed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run weekly jobs
router.post("/run/weekly", async (req, res) => {
  try {
    await runWeeklyJobs();
    res.json({ success: true, message: "Weekly jobs executed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run monthly jobs
router.post("/run/monthly", async (req, res) => {
  try {
    await runMonthlyJobs();
    res.json({ success: true, message: "Monthly jobs executed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run backup
router.post("/run/backup", async (req, res) => {
  try {
    await runBackup();
    res.json({ success: true, message: "Backup executed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;