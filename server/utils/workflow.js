// =======================================
// PROJECT WORKFLOW ENGINE
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
function validateStatusTransition(currentStatus, newStatus) {
  const currentEnglish = STATUS_MAP[currentStatus] || currentStatus;
  const newEnglish = STATUS_MAP[newStatus] || newStatus;
  
  const allowedTransitions = PROJECT_STATUS_TRANSITIONS[currentEnglish] || [];
  return allowedTransitions.includes(newEnglish);
}

/**
 * Record status history
 * @param {object} db - Database connection
 * @param {number} projectId - Project ID
 * @param {string} oldStatus - Old status
 * @param {string} newStatus - New status
 * @param {string} userId - User ID (optional, for future)
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

module.exports = {
  PROJECT_STATUS_TRANSITIONS,
  STATUS_MAP,
  STATUS_MAP_REVERSE,
  validateStatusTransition,
  recordStatusHistory,
  getStatusHistory
};