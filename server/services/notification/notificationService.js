// =======================================
// NOTIFICATION SERVICE
// =======================================

const { NOTIFICATION_TYPES } = require("./notificationTypes");

/**
 * Create a notification
 * @param {object} db - Database connection
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 * @param {function} callback - Callback function
 */
function createNotification(db, type, title, message, data = {}, callback) {
  db.run(
    `INSERT INTO notifications (type, title, message, data, is_read, created_at)
     VALUES (?, ?, ?, ?, 0, ?)`,
    [type, title, message, JSON.stringify(data), new Date().toISOString()],
    function(err) {
      if (err) return callback(err);
      callback(null, { success: true, notificationId: this.lastID });
    }
  );
}

/**
 * Get all notifications
 * @param {object} db - Database connection
 * @param {function} callback - Callback function
 */
function getNotifications(db, callback) {
  db.all(
    `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`,
    [],
    callback
  );
}

/**
 * Get unread notifications
 * @param {object} db - Database connection
 * @param {function} callback - Callback function
 */
function getUnreadNotifications(db, callback) {
  db.all(
    `SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC`,
    [],
    callback
  );
}

/**
 * Mark notification as read
 * @param {object} db - Database connection
 * @param {number} notificationId - Notification ID
 * @param {function} callback - Callback function
 */
function markAsRead(db, notificationId, callback) {
  db.run(
    "UPDATE notifications SET is_read = 1 WHERE id = ?",
    [notificationId],
    callback
  );
}

/**
 * Check for low stock alerts
 * @param {object} db - Database connection
 * @param {function} callback - Callback function
 */
function checkLowStock(db, callback) {
  db.all(
    `SELECT id, name, quantity, minimum_quantity
     FROM products 
     WHERE quantity <= minimum_quantity 
     ORDER BY quantity ASC`,
    [],
    (err, products) => {
      if (err) return callback(err);
      
      products.forEach(product => {
        createNotification(
          db,
          NOTIFICATION_TYPES.LOW_STOCK,
          "Low Stock Alert",
          `Product ${product.name} is running low. Current: ${product.quantity}, Minimum: ${product.minimum_quantity}`,
          { productId: product.id, quantity: product.quantity, minimum: product.minimum_quantity },
          () => {}
        );
      });
      
      callback(null, products);
    }
  );
}

/**
 * Check for overdue invoices
 * @param {object} db - Database connection
 * @param {function} callback - Callback function
 */
function checkOverdueInvoices(db, callback) {
  const today = new Date().toISOString().slice(0, 10);
  db.all(
    `SELECT i.*, c.name as client_name
     FROM invoices i
     LEFT JOIN clients c ON i.client_id = c.id
     WHERE i.status = 'غير مدفوعة' AND i.invoice_date < ?`,
    [today],
    (err, invoices) => {
      if (err) return callback(err);
      
      invoices.forEach(invoice => {
        createNotification(
          db,
          NOTIFICATION_TYPES.OVERDUE_INVOICE,
          "Overdue Invoice",
          `Invoice ${invoice.invoice_number} for ${invoice.client_name} is overdue`,
          { invoiceId: invoice.id, amount: invoice.amount },
          () => {}
        );
      });
      
      callback(null, invoices);
    }
  );
}

/**
 * Check for delayed projects
 * @param {object} db - Database connection
 * @param {function} callback - Callback function
 */
function checkDelayedProjects(db, callback) {
  const today = new Date().toISOString().slice(0, 10);
  db.all(
    `SELECT p.*, c.name as client_name
     FROM projects p
     LEFT JOIN clients c ON p.client_id = c.id
     WHERE p.status IN ('قيد التنفيذ', 'بدأ') AND p.end_date < ?`,
    [today],
    (err, projects) => {
      if (err) return callback(err);
      
      projects.forEach(project => {
        createNotification(
          db,
          NOTIFICATION_TYPES.DELAYED_PROJECT,
          "Delayed Project",
          `Project ${project.name} is delayed. End date was ${project.end_date}`,
          { projectId: project.id },
          () => {}
        );
      });
      
      callback(null, projects);
    }
  );
}

/**
 * Check for upcoming deadlines
 * @param {object} db - Database connection
 * @param {function} callback - Callback function
 */
function checkUpcomingDeadlines(db, callback) {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const todayStr = today.toISOString().slice(0, 10);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);
  
  db.all(
    `SELECT p.*, c.name as client_name
     FROM projects p
     LEFT JOIN clients c ON p.client_id = c.id
     WHERE p.status IN ('قيد التنفيذ', 'بدأ') 
     AND p.end_date BETWEEN ? AND ?`,
    [todayStr, nextWeekStr],
    (err, projects) => {
      if (err) return callback(err);
      
      projects.forEach(project => {
        createNotification(
          db,
          NOTIFICATION_TYPES.UPCOMING_DEADLINE,
          "Upcoming Deadline",
          `Project ${project.name} deadline is approaching on ${project.end_date}`,
          { projectId: project.id },
          () => {}
        );
      });
      
      callback(null, projects);
    }
  );
}

/**
 * Check for upcoming payments (expenses not fully paid)
 * @param {object} db - Database connection
 * @param {function} callback - Callback function
 */
function checkUpcomingPayments(db, callback) {
  db.all(
    `SELECT e.*, s.name as supplier_name
     FROM expenses e
     LEFT JOIN suppliers s ON e.supplier_id = s.id
     WHERE e.paid_amount < e.total_amount
     ORDER BY e.expense_date ASC`,
    [],
    (err, expenses) => {
      if (err) return callback(err);
      
      expenses.forEach(expense => {
        createNotification(
          db,
          NOTIFICATION_TYPES.UPCOMING_PAYMENT,
          "Upcoming Payment",
          `Payment due to ${expense.supplier_name}: ${expense.total_amount - expense.paid_amount} DA`,
          { expenseId: expense.id, amount: expense.total_amount - expense.paid_amount },
          () => {}
        );
      });
      
      callback(null, expenses);
    }
  );
}

/**
 * Check for client debts (unpaid invoices)
 * @param {object} db - Database connection
 * @param {function} callback - Callback function
 */
function checkClientDebts(db, callback) {
  db.all(
    `SELECT i.*, c.name as client_name
     FROM invoices i
     LEFT JOIN clients c ON i.client_id = c.id
     WHERE i.status = 'غير مدفوعة'
     ORDER BY i.invoice_date ASC`,
    [],
    (err, invoices) => {
      if (err) return callback(err);
      
      invoices.forEach(invoice => {
        createNotification(
          db,
          NOTIFICATION_TYPES.CLIENT_DEBT,
          "Client Debt",
          `Outstanding invoice from ${invoice.client_name}: ${invoice.amount} DA`,
          { invoiceId: invoice.id, amount: invoice.amount },
          () => {}
        );
      });
      
      callback(null, invoices);
    }
  );
}

/**
 * Check for supplier debts (unpaid expenses)
 * @param {object} db - Database connection
 * @param {function} callback - Callback function
 */
function checkSupplierDebts(db, callback) {
  db.all(
    `SELECT e.*, s.name as supplier_name
     FROM expenses e
     LEFT JOIN suppliers s ON e.supplier_id = s.id
     WHERE e.paid_amount < e.total_amount
     ORDER BY e.expense_date ASC`,
    [],
    (err, expenses) => {
      if (err) return callback(err);
      
      expenses.forEach(expense => {
        createNotification(
          db,
          NOTIFICATION_TYPES.SUPPLIER_DEBT,
          "Supplier Debt",
          `Outstanding payment to ${expense.supplier_name}: ${expense.total_amount - expense.paid_amount} DA`,
          { expenseId: expense.id, amount: expense.total_amount - expense.paid_amount },
          () => {}
        );
      });
      
      callback(null, expenses);
    }
  );
}

/**
 * Run all notification checks
 * @param {object} db - Database connection
 * @param {function} callback - Callback function
 */
function runAllChecks(db, callback) {
  const results = {};
  
  checkLowStock(db, (err, products) => {
    results.lowStock = products || [];
    
    checkOverdueInvoices(db, (err, invoices) => {
      results.overdueInvoices = invoices || [];
      
      checkDelayedProjects(db, (err, projects) => {
        results.delayedProjects = projects || [];
        
        checkUpcomingDeadlines(db, (err, deadlines) => {
          results.upcomingDeadlines = deadlines || [];
          callback(null, results);
        });
      });
    });
  });
}

module.exports = {
  createNotification,
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  checkLowStock,
  checkOverdueInvoices,
  checkDelayedProjects,
  checkUpcomingDeadlines,
  checkUpcomingPayments,
  checkClientDebts,
  checkSupplierDebts,
  runAllChecks
};
