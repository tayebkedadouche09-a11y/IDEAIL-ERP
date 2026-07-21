const db = require("../../database");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

// Log automation job
function logJob(jobName, status, message) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO automation_logs (job_name, status, message) VALUES (?, ?, ?)",
      [jobName, status, message],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

// Initialize scheduler
function initScheduler() {
  // Daily jobs - run at 1 AM
  cron.schedule("0 1 * * *", async () => {
    await runDailyJobs();
  });

  // Weekly jobs - run on Sunday at 2 AM
  cron.schedule("0 2 * * 0", async () => {
    await runWeeklyJobs();
  });

  // Monthly jobs - run on 1st at 3 AM
  cron.schedule("0 3 1 * *", async () => {
    await runMonthlyJobs();
  });

  console.log("✅ Automation scheduler initialized");
}

// Run daily jobs
async function runDailyJobs() {
  try {
    await logJob("daily", "started", "Daily automation started");
    
    // Check low stock
    const { checkLowStock } = require("./inventoryAutomation");
    await checkLowStock();
    
    // Check delayed projects
    const { checkDelayedProjects } = require("./dailyAutomation");
    await checkDelayedProjects();
    
    // Check overdue invoices
    const { checkOverdueInvoices } = require("./dailyAutomation");
    await checkOverdueInvoices();
    
    // Update dashboard stats
    const { updateDashboardStats } = require("./dashboardAutomation");
    await updateDashboardStats();
    
    await logJob("daily", "completed", "Daily automation completed");
  } catch (error) {
    await logJob("daily", "error", error.message);
  }
}

// Run weekly jobs
async function runWeeklyJobs() {
  try {
    await logJob("weekly", "started", "Weekly automation started");
    
    const { generateWeeklyReport } = require("./weeklyAutomation");
    await generateWeeklyReport();
    
    await logJob("weekly", "completed", "Weekly automation completed");
  } catch (error) {
    await logJob("weekly", "error", error.message);
  }
}

// Run monthly jobs
async function runMonthlyJobs() {
  try {
    await logJob("monthly", "started", "Monthly automation started");
    
    const { generateMonthlyReport } = require("./monthlyAutomation");
    await generateMonthlyReport();
    
    await logJob("monthly", "completed", "Monthly automation completed");
  } catch (error) {
    await logJob("monthly", "error", error.message);
  }
}

// Run backup
async function runBackup() {
  try {
    await logJob("backup", "started", "Backup started");
    
    const { createBackup } = require("./backupAutomation");
    await createBackup();
    
    await logJob("backup", "completed", "Backup completed");
  } catch (error) {
    await logJob("backup", "error", error.message);
  }
}

// Get status
function getStatus() {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM automation_logs WHERE job_name = 'daily' ORDER BY created_at DESC LIMIT 1",
      [],
      (err, daily) => {
        if (err) return reject(err);
        
        db.get(
          "SELECT * FROM automation_logs WHERE job_name = 'weekly' ORDER BY created_at DESC LIMIT 1",
          [],
          (err, weekly) => {
            if (err) return reject(err);
            
            db.get(
              "SELECT * FROM automation_logs WHERE job_name = 'monthly' ORDER BY created_at DESC LIMIT 1",
              [],
              (err, monthly) => {
                if (err) return reject(err);
                
                db.get(
                  "SELECT * FROM automation_logs WHERE job_name = 'backup' ORDER BY created_at DESC LIMIT 1",
                  [],
                  (err, backup) => {
                    if (err) return reject(err);
                    
                    resolve({
                      daily: daily || {},
                      weekly: weekly || {},
                      monthly: monthly || {},
                      backup: backup || {},
                      scheduler: "running",
                    });
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

// Get logs
function getLogs(limit = 100) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM automation_logs ORDER BY created_at DESC LIMIT ?",
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

module.exports = {
  initScheduler,
  runDailyJobs,
  runWeeklyJobs,
  runMonthlyJobs,
  runBackup,
  getStatus,
  getLogs,
  logJob,
};