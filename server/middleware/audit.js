const db = require("../database");

// Audit log middleware - records all CRUD operations
function auditLog(action, module) {
  return (req, res, next) => {
    const userId = req.user?.id || null;
    const recordId = req.params.id || req.body.id || null;
    
    // Log the action
    db.run(
      `INSERT INTO events (event_name, event_data) VALUES (?, ?)`,
      [
        `${module}_${action}`,
        JSON.stringify({
          user_id: userId,
          record_id: recordId,
          method: req.method,
          path: req.path,
          body: req.body,
          timestamp: new Date().toISOString()
        })
      ],
      (err) => {
        if (err) console.error("Audit log error:", err.message);
      }
    );
    
    next();
  };
}

// Log login events
function logLogin(req, res, next) {
  const { username } = req.body;
  
  db.run(
    `INSERT INTO events (event_name, event_data) VALUES (?, ?)`,
    [
      "user_login",
      JSON.stringify({
        username: username,
        ip: req.ip,
        timestamp: new Date().toISOString()
      })
    ],
    (err) => {
      if (err) console.error("Login log error:", err.message);
    }
  );
  
  next();
}

module.exports = {
  auditLog,
  logLogin
};