// =======================================
// PROJECT WORKFLOW SERVICE
// =======================================

// Valid project status transitions
const PROJECT_STATUS_TRANSITIONS = {
  "Planning": ["Approved", "Cancelled"],
  "Approved": ["Started", "Cancelled"],
  "Started": ["In Progress", "Cancelled"],
  "In Progress": ["Completed", "Paused", "Cancelled"],
  "Paused": ["In Progress", "Cancelled"],
  "Completed": ["Invoiced", "Cancelled"],
  "Invoiced": ["Paid", "Cancelled"],
  "Paid": ["Archived"],
  "Archived": [],
  "Cancelled": []
};

// Map Arabic status to English
const STATUS_MAP = {
  "جديد": "Planning",
  "موافق عليه": "Approved",
  "بدأ": "Started",
  "قيد التنفيذ": "In Progress",
  "مكتمل": "Completed",
  "مفوتر": "Invoiced",
  "مدفوع": "Paid",
  "مؤرشف": "Archived",
  "ملغي": "Cancelled"
};

// Map English to Arabic
const STATUS_MAP_REVERSE = {
  "Planning": "جديد",
  "Approved": "موافق عليه",
  "Started": "بدأ",
  "In Progress": "قيد التنفيذ",
  "Completed": "مكتمل",
  "Invoiced": "مفوتر",
  "Paid": "مدفوع",
  "Archived": "مؤرشف",
  "Cancelled": "ملغي"
};

/**
 * Validate status transition
 * @param {string} currentStatus - Current status (Arabic)
 * @param {string} newStatus - New status (Arabic)
 * @returns {boolean} - Whether transition is valid
 */
function validateTransition(currentStatus, newStatus) {
  const currentEnglish = STATUS_MAP[currentStatus] || currentStatus;
  const newEnglish = STATUS_MAP[newStatus] || newStatus;
  
  const allowedTransitions = PROJECT_STATUS_TRANSITIONS[currentEnglish] || [];
  return allowedTransitions.includes(newEnglish);
}

/**
 * Change project status with validation
 * @param {object} db - Database connection
 * @param {number} projectId - Project ID
 * @param {string} newStatus - New status (Arabic)
 * @param {function} callback - Callback function
 */
function changeStatus(db, projectId, newStatus, callback) {
  // Get current status
  db.get("SELECT status FROM projects WHERE id = ?", [projectId], (err, project) => {
    if (err) return callback(err);
    if (!project) return callback(new Error("Project not found"));
    
    // Validate transition
    if (!validateTransition(project.status, newStatus)) {
      return callback(new Error(`Invalid status transition from ${project.status} to ${newStatus}`));
    }
    
    // Update status
    db.run(
      "UPDATE projects SET status = ? WHERE id = ?",
      [newStatus, projectId],
      function(updateErr) {
        if (updateErr) return callback(updateErr);
        
        // Record history
        recordStatusHistory(db, projectId, project.status, newStatus);
        
        callback(null, { success: true, oldStatus: project.status, newStatus });
      }
    );
  });
}

/**
 * Record status history
 * @param {object} db - Database connection
 * @param {number} projectId - Project ID
 * @param {string} oldStatus - Old status
 * @param {string} newStatus - New status
 * @param {string} userId - User ID (optional)
 */
function recordStatusHistory(db, projectId, oldStatus, newStatus, userId = null) {
  db.run(
    `INSERT INTO project_status_history (project_id, old_status, new_status, changed_at, user_id)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
    [projectId, oldStatus, newStatus, userId],
    (err) => {
      if (err) console.error("Error recording status history:", err.message);
    }
  );
}

/**
 * Get project status history
 * @param {object} db - Database connection
 * @param {number} projectId - Project ID
 * @param {function} callback - Callback function
 */
function getStatusHistory(db, projectId, callback) {
  db.all(
    `SELECT * FROM project_status_history 
     WHERE project_id = ? 
     ORDER BY changed_at DESC`,
    [projectId],
    callback
  );
}

/**
 * Create project from quotation
 * @param {object} db - Database connection
 * @param {number} devisId - Devis ID
 * @param {function} callback - Callback function
 */
function createProjectFromQuotation(db, devisId, callback) {
  // Get devis details
  db.get(
    `SELECT d.*, c.name as client_name 
     FROM devis d 
     LEFT JOIN clients c ON d.client_id = c.id 
     WHERE d.id = ?`,
    [devisId],
    (err, devis) => {
      if (err) return callback(err);
      if (!devis) return callback(new Error("Devis not found"));
      
      // Create project
      db.run(
        `INSERT INTO projects (client_id, name, description, amount, status, start_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [devis.client_id, devis.title || "Project from Devis", devis.description, devis.amount, "Started", new Date().toISOString().slice(0, 10)],
        function(insertErr) {
          if (insertErr) return callback(insertErr);
          
          // Update devis status
          db.run(
            "UPDATE devis SET status = 'accepted' WHERE id = ?",
            [devisId],
            (updateErr) => {
              if (updateErr) console.error("Error updating devis status:", updateErr.message);
            }
          );
          
          callback(null, { success: true, projectId: this.lastID });
        }
      );
    }
  );
}

module.exports = {
  PROJECT_STATUS_TRANSITIONS,
  STATUS_MAP,
  STATUS_MAP_REVERSE,
  validateTransition,
  changeStatus,
  recordStatusHistory,
  getStatusHistory,
  createProjectFromQuotation
};