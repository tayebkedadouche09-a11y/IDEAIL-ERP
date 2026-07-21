// =======================================
// EVENT HANDLERS
// =======================================

const { projectWorkflow } = require("../workflow");
const { invoiceWorkflow } = require("../workflow");
const { stockWorkflow } = require("../workflow");

/**
 * Initialize all event handlers
 * @param {object} db - Database connection
 * @param {function} emit - Emit function
 */
function init(db, emit) {
  // Quotation Approved → Create Project
  on("QuotationApproved", (data) => {
    projectWorkflow.createProjectFromQuotation(db, data.devisId, (err, result) => {
      if (err) {
        console.error("Error creating project from quotation:", err.message);
        return;
      }
      emit("ProjectCreated", { projectId: result.projectId, devisId: data.devisId }, db);
    });
  });

  // Project Completed → Create Invoice
  on("ProjectCompleted", (data) => {
    invoiceWorkflow.createInvoiceFromProject(db, data.projectId, (err, result) => {
      if (err) {
        console.error("Error creating invoice from project:", err.message);
        return;
      }
      emit("InvoiceCreated", { invoiceId: result.invoiceId, projectId: data.projectId }, db);
    });
  });

  // Invoice Created → Update Project Status
  on("InvoiceCreated", (data) => {
    db.run(
      "UPDATE projects SET status = 'مفوتر' WHERE id = ?",
      [data.projectId],
      (err) => {
        if (err) console.error("Error updating project status:", err.message);
      }
    );
  });

  // Payment Received → Check Invoice Status
  on("PaymentReceived", (data) => {
    // Get invoice total
    db.get(
      "SELECT amount FROM invoices WHERE id = ?",
      [data.invoiceId],
      (err, invoice) => {
        if (err) return;
        
        // Get total paid
        db.get(
          "SELECT COALESCE(SUM(amount), 0) as totalPaid FROM payments WHERE invoice_id = ?",
          [data.invoiceId],
          (err, result) => {
            if (err) return;
            
            if (result.totalPaid >= invoice.amount) {
              // Mark invoice as paid
              db.run(
                "UPDATE invoices SET status = 'مدفوعة' WHERE id = ?",
                [data.invoiceId],
                (err) => {
                  if (err) console.error("Error updating invoice status:", err.message);
                }
              );
              
              // Update project status
              db.get(
                "SELECT project_id FROM invoices WHERE id = ?",
                [data.invoiceId],
                (err, inv) => {
                  if (err) return;
                  if (inv?.project_id) {
                    db.run(
                      "UPDATE projects SET status = 'مدفوع' WHERE id = ?",
                      [inv.project_id],
                      (err) => {
                        if (err) console.error("Error updating project status:", err.message);
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    );
  });

  // Material Added → Check Stock
  on("MaterialAdded", (data) => {
    stockWorkflow.checkStockLevels(db, (err, alerts) => {
      if (err) return;
      if (alerts && alerts.length > 0) {
        emit("LowStockAlert", { alerts }, db);
      }
    });
  });
}

// Import on from eventBus (will be replaced at runtime)
let on = () => {};

module.exports = {
  init,
  setOn: (handler) => { on = handler; }
};