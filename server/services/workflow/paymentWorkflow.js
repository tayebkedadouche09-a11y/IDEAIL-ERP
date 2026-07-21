// =======================================
// PAYMENT WORKFLOW SERVICE
// =======================================

/**
 * Register payment
 * @param {object} db - Database connection
 * @param {object} paymentData - Payment data
 * @param {function} callback - Callback function
 */
function registerPayment(db, paymentData, callback) {
  const {
    client_id,
    invoice_id,
    amount,
    payment_method,
    payment_date,
    reference_number,
    notes
  } = paymentData;
  
  db.run(
    `INSERT INTO payments (client_id, invoice_id, amount, payment_method, payment_date, reference_number, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [client_id, invoice_id, amount, payment_method || "cash", payment_date, reference_number, notes],
    function(err) {
      if (err) return callback(err);
      
      // If invoice_id provided, check if fully paid
      if (invoice_id) {
        db.get(
          "SELECT amount FROM invoices WHERE id = ?",
          [invoice_id],
          (invoiceErr, invoice) => {
            if (invoiceErr) return callback(invoiceErr);
            
            db.get(
              "SELECT COALESCE(SUM(amount), 0) as totalPaid FROM payments WHERE invoice_id = ?",
              [invoice_id],
              (sumErr, result) => {
                if (sumErr) return callback(sumErr);
                
                // If fully paid, update invoice status
                if (result.totalPaid >= invoice.amount) {
                  db.run(
                    "UPDATE invoices SET status = 'مدفوعة' WHERE id = ?",
                    [invoice_id],
                    (updateErr) => {
                      if (updateErr) console.error("Error updating invoice status:", updateErr.message);
                    }
                  );
                }
                
                callback(null, { success: true, paymentId: this.lastID });
              }
            );
          }
        );
      } else {
        callback(null, { success: true, paymentId: this.lastID });
      }
    }
  );
}

/**
 * Get project payments
 * @param {object} db - Database connection
 * @param {number} projectId - Project ID
 * @param {function} callback - Callback function
 */
function getProjectPayments(db, projectId, callback) {
  db.all(
    `SELECT p.*, i.invoice_number 
     FROM payments p 
     LEFT JOIN invoices i ON p.invoice_id = i.id 
     WHERE i.project_id = ? 
     ORDER BY p.created_at DESC`,
    [projectId],
    callback
  );
}

/**
 * Get client payments
 * @param {object} db - Database connection
 * @param {number} clientId - Client ID
 * @param {function} callback - Callback function
 */
function getClientPayments(db, clientId, callback) {
  db.all(
    `SELECT * FROM payments WHERE client_id = ? ORDER BY created_at DESC`,
    [clientId],
    callback
  );
}

module.exports = {
  registerPayment,
  getProjectPayments,
  getClientPayments
};