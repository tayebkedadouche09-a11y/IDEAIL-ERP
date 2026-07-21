// =======================================
// INVOICE WORKFLOW SERVICE
// =======================================

/**
 * Create invoice from project
 * @param {object} db - Database connection
 * @param {number} projectId - Project ID
 * @param {function} callback - Callback function
 */
function createInvoiceFromProject(db, projectId, callback) {
  // Get project details
  db.get(
    `SELECT p.*, c.name as client_name 
     FROM projects p 
     LEFT JOIN clients c ON p.client_id = c.id 
     WHERE p.id = ?`,
    [projectId],
    (err, project) => {
      if (err) return callback(err);
      if (!project) return callback(new Error("Project not found"));
      
      // Generate invoice number
      db.get(
        "SELECT setting_value FROM company_settings WHERE setting_key = 'invoice_prefix'",
        [],
        (prefixErr, prefixRow) => {
          if (prefixErr) return callback(prefixErr);
          
          const prefix = prefixRow?.setting_value || "INV";
          
          db.get(
            "SELECT setting_value FROM company_settings WHERE setting_key = 'invoice_start_number'",
            [],
            (numErr, numRow) => {
              if (numErr) return callback(numErr);
              
              // Get next invoice number
              db.get(
                "SELECT MAX(id) as maxId FROM invoices",
                [],
                (maxErr, maxRow) => {
                  if (maxErr) return callback(maxErr);
                  
                  const nextNumber = (maxRow?.maxId || 0) + 1;
                  const invoiceNumber = `${prefix}-${String(nextNumber).padStart(4, "0")}`;
                  
                  // Create invoice
                  db.run(
                    `INSERT INTO invoices (client_id, project_id, invoice_number, amount, status, invoice_date)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [project.client_id, projectId, invoiceNumber, project.amount, "غير مدفوعة", new Date().toISOString().slice(0, 10)],
                    function(insertErr) {
                      if (insertErr) return callback(insertErr);
                      
                      // Update project status
                      db.run(
                        "UPDATE projects SET status = 'مفوتر' WHERE id = ?",
                        [projectId],
                        (updateErr) => {
                          if (updateErr) console.error("Error updating project status:", updateErr.message);
                        }
                      );
                      
                      callback(null, { success: true, invoiceId: this.lastID, invoiceNumber });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

/**
 * Mark invoice as paid
 * @param {object} db - Database connection
 * @param {number} invoiceId - Invoice ID
 * @param {function} callback - Callback function
 */
function markInvoicePaid(db, invoiceId, callback) {
  db.run(
    "UPDATE invoices SET status = 'مدفوعة' WHERE id = ?",
    [invoiceId],
    function(err) {
      if (err) return callback(err);
      
      // Get project and update status
      db.get(
        "SELECT project_id FROM invoices WHERE id = ?",
        [invoiceId],
        (projectErr, invoice) => {
          if (projectErr) return callback(projectErr);
          
          if (invoice?.project_id) {
            db.run(
              "UPDATE projects SET status = 'مدفوع' WHERE id = ?",
              [invoice.project_id],
              (updateErr) => {
                if (updateErr) console.error("Error updating project status:", updateErr.message);
              }
            );
          }
          
          callback(null, { success: true, message: "Invoice marked as paid" });
        }
      );
    }
  );
}

/**
 * Get project invoices
 * @param {object} db - Database connection
 * @param {number} projectId - Project ID
 * @param {function} callback - Callback function
 */
function getProjectInvoices(db, projectId, callback) {
  db.all(
    `SELECT * FROM invoices WHERE project_id = ? ORDER BY created_at DESC`,
    [projectId],
    callback
  );
}

module.exports = {
  createInvoiceFromProject,
  markInvoicePaid,
  getProjectInvoices
};