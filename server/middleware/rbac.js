const db = require("../database");

// Role definitions with module permissions
const ROLE_PERMISSIONS = {
  // Existing installations use `admin`; the specification calls this role
  // Administrator.  Supporting both keeps the permission model backwards
  // compatible while enforcing the same access level.
  admin: {
    modules: "*",
    permissions: ["create", "read", "update", "delete"],
  },
  administrator: {
    modules: "*",
    permissions: ["create", "read", "update", "delete"],
  },
  accountant: {
    modules: ["invoices", "payments", "expenses", "reports", "financial", "clients", "suppliers"],
    permissions: ["create", "read", "update", "delete"],
  },
  project_manager: {
    modules: ["projects", "systems", "employees", "reports", "calculator", "profitability"],
    permissions: ["create", "read", "update", "delete"],
  },
  storekeeper: {
    modules: ["products", "stock", "inventory", "documents", "systems"],
    permissions: ["create", "read", "update", "delete"],
  },
  employee: {
    modules: ["attendance", "documents", "projects", "calendar"],
    permissions: ["read", "create"],
  },
};

// Map frontend route paths to backend modules
const MODULE_MAP = {
  "/clients": "clients",
  "/clients/": "clients",
  "/suppliers": "suppliers",
  "/employees": "employees",
  "/employee-evaluations": "employees",
  "/projects": "projects",
  "/project-materials": "projects",
  "/project-expenses": "projects",
  "/profitability": "profitability",
  "/products": "products",
  "/stock": "stock",
  "/system-products": "systems",
  "/systems": "systems",
  "/calculator": "calculator",
  "/invoices": "invoices",
  "/devis": "invoices",
  "/quotations": "invoices",
  "/payments": "payments",
  "/expenses": "expenses",
  "/reports": "reports",
  "/documents": "documents",
  "/vehicles": "vehicles",
  "/calendar": "calendar",
  "/backup": "backup",
  "/financial": "financial",
  "/calendar": "calendar",
  "/inventory": "inventory",
  "/backup": "backup",
  "/automation": "automation",
  "/audit": "audit",
  "/assistant": "assistant",
  "/ai": "assistant",
};

/**
 * Middleware: Check if user has access to a specific module
 */
function checkModuleAccess(moduleName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const userRole = req.user.role;
    const roleConfig = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.employee;

    // Admin has access to all modules
    if (roleConfig.modules === "*") {
      return next();
    }

    // Check if user's role has access to this module
    if (!roleConfig.modules.includes(moduleName)) {
      return res.status(403).json({
        error: "Access denied. You do not have permission to access this module.",
        required_module: moduleName,
        your_role: userRole,
      });
    }

    next();
  };
}

/**
 * Middleware: Check specific permission for module
 */
function checkPermission(action) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const userRole = req.user.role;
    const roleConfig = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.employee;

    if (!roleConfig.permissions.includes(action)) {
      return res.status(403).json({
        error: "Access denied. You do not have the required permission.",
        required_action: action,
        your_role: userRole,
      });
    }

    next();
  };
}

/**
 * Middleware: Auto-detect module from route path
 */
function requireModuleAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const userRole = req.user.role;
  const roleConfig = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.employee;

  // Admin has access to all modules
  if (roleConfig.modules === "*") {
    return next();
  }

  // Find the module for this route
  const path = req.path.toLowerCase();
  let moduleName = null;

  for (const [routePrefix, module] of Object.entries(MODULE_MAP)) {
    if (path.startsWith(routePrefix.toLowerCase())) {
      moduleName = module;
      break;
    }
  }

  // Routes not assigned to a business module (health checks, notifications,
  // etc.) are authenticated but do not need a module entitlement.
  if (!moduleName) return next();

  if (!roleConfig.modules.includes(moduleName)) {
    return res.status(403).json({
      error: "Access denied. You do not have permission to access this module.",
      required_module: moduleName,
      your_role: userRole,
    });
  }

  const action = { POST: "create", PUT: "update", PATCH: "update", DELETE: "delete" }[req.method] || "read";
  if (!roleConfig.permissions.includes(action)) {
    return res.status(403).json({
      error: "Access denied. You do not have the required permission.",
      required_action: action,
      your_role: userRole,
    });
  }

  next();
}

/**
 * Get user permissions for frontend
 */
function getUserPermissions(req, res) {
  if (!req.user) {
    return res.json({ authenticated: false });
  }

  const userRole = req.user.role;
  const roleConfig = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.employee;

  res.json({
    authenticated: true,
    user: req.user,
    role: userRole,
    modules: roleConfig.modules === "*" ? Object.values(MODULE_MAP) : roleConfig.modules,
    permissions: roleConfig.permissions,
  });
}

module.exports = {
  ROLE_PERMISSIONS,
  MODULE_MAP,
  checkModuleAccess,
  checkPermission,
  requireModuleAccess,
  getUserPermissions,
};
