const db = require("../../database");
const fs = require("fs");
const path = require("path");
const { eventBus } = require("../events");

// Create backup
function createBackup() {
  return new Promise((resolve, reject) => {
    const backupDir = path.join(__dirname, "../../backups");
    
    // Create backup directory if not exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `backup-${timestamp}.db`);
    
    // Copy database
    const dbPath = path.join(__dirname, "../../ideail.db");
    
    try {
      fs.copyFileSync(dbPath, backupFile);
      
      // Clean old backups (keep last 30)
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith("backup-"))
        .sort()
        .reverse()
        .slice(30);
      
      files.forEach(f => {
        fs.unlinkSync(path.join(backupDir, f));
      });
      
      eventBus.emit("BackupCompleted", { file: backupFile }, db);
      
      resolve({ file: backupFile, success: true });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  createBackup,
};