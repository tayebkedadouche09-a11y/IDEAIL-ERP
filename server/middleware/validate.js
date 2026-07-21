const { body, param, validationResult } = require("express-validator");

/**
 * Middleware: Check validation results and return errors if any
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

// ===============================
// Auth Validation Rules
// ===============================

const validateLogin = [
  body("username").notEmpty().withMessage("Username or email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const validateRegister = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("full_name").optional().trim().notEmpty().withMessage("Full name cannot be empty"),
  handleValidationErrors,
];

const validateChangePassword = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
  handleValidationErrors,
];

// ===============================
// Client Validation Rules
// ===============================

const validateClient = [
  body("name").trim().notEmpty().withMessage("Client name is required"),
  body("phone").optional().trim(),
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("address").optional().trim(),
  handleValidationErrors,
];

// ===============================
// Project Validation Rules
// ===============================

const validateProject = [
  body("name").trim().notEmpty().withMessage("Project name is required"),
  body("client_id").isInt({ min: 1 }).withMessage("Valid client is required"),
  body("amount").optional().isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
  handleValidationErrors,
];

// ===============================
// Product Validation Rules
// ===============================

const validateProduct = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("purchase_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Purchase price must be a positive number"),
  body("sale_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Sale price must be a positive number"),
  handleValidationErrors,
];

// ===============================
// Employee Validation Rules
// ===============================

const validateEmployee = [
  body("name").trim().notEmpty().withMessage("Employee name is required"),
  body("daily_rate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Daily rate must be a positive number"),
  handleValidationErrors,
];

// ===============================
// Invoice Validation Rules
// ===============================

const validateInvoice = [
  body("client_id").isInt({ min: 1 }).withMessage("Valid client is required"),
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
  handleValidationErrors,
];

// ===============================
// ID Param Validation
// ===============================

const validateId = [
  param("id").isInt({ min: 1 }).withMessage("Valid ID is required"),
  handleValidationErrors,
];

module.exports = {
  validateLogin,
  validateRegister,
  validateChangePassword,
  validateClient,
  validateProject,
  validateProduct,
  validateEmployee,
  validateInvoice,
  validateId,
  handleValidationErrors,
};