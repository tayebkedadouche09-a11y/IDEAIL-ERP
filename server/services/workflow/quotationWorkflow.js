// =======================================
// QUOTATION WORKFLOW SERVICE
// =======================================

/**
 * Accept quotation and create project
 * @param {object} db - Database connection
 * @param {number} devisId - Devis ID
 * @param {function} callback - Callback function
 */
function acceptQuotation(db, devisId, callback) {
  // Get devis details
  db.get(
    `SELECT d.*, c.name as client_name 
     FROM devis d 
     LEFT JOIN clients c ON d.client_id = c.id 
     WHERE d.id = ?`,
    [devisId],
    (err, devis) => {
      if (err) return callback(err);
      if (!devis) return callback(new Error("Quotation not found"));
      
      // Update devis status
      db.run(
        "UPDATE devis SET status = 'accepted' WHERE id = ?",
        [devisId],
        function(updateErr) {
          if (updateErr) return callback(updateErr);
          
          callback(null, { success: true, message: "Quotation accepted" });
        }
      );
    }
  );
}

/**
 * Reject quotation
 * @param {object} db - Database connection
 * @param {number} devisId - Devis ID
 * @param {function} callback - Callback function
 */
function rejectQuotation(db, devisId, callback) {
  db.run(
    "UPDATE devis SET status = 'refused' WHERE id = ?",
    [devisId],
    function(err) {
      if (err) return callback(err);
      callback(null, { success: true, message: "Quotation rejected" });
    }
  );
}

/**
 * Convert quotation to project
 * @param {object} db - Database connection
 * @param {number} devisId - Devis ID
 * @param {object} projectData - Additional project data
 * @param {function} callback - Callback function
 */
function convertToProject(db, devisId, projectData = {}, callback) {
  // Get devis details
  db.get(
    `SELECT d.*, c.name as client_name 
     FROM devis d 
     LEFT JOIN clients c ON d.client_id = c.id 
     WHERE d.id = ?`,
    [devisId],
    (err, devis) => {
      if (err) return callback(err);
      if (!devis) return callback(new Error("Quotation not found"));
      
      // Create project
      db.run(
        `INSERT INTO projects (client_id, name, description, amount, status, start_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          devis.client_id,
          projectData.name || devis.title || "Project from Quotation",
          projectData.description || devis.description,
          devis.amount,
          "Started",
          projectData.start_date || new Date().toISOString().slice(0, 10)
        ],
        function(insertErr) {
          if (insertErr) return callback(insertErr);
          
          const projectId = this.lastID;
          
          // Update devis status and link to project
          db.run(
            "UPDATE devis SET status = 'accepted', project_id = ? WHERE id = ?",
            [projectId, devisId],
            (updateErr) => {
              if (updateErr) console.error("Error updating devis:", updateErr.message);
            }
          );
          
          callback(null, { success: true, projectId, message: "Project created from quotation" });
        }
      );
    }
  );
}

module.exports = {
  acceptQuotation,
  rejectQuotation,
  convertToProject
};