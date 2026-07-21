const jwt = require("jsonwebtoken");
const db = require("../database");

// JWT secret key - should be in .env in production
const JWT_SECRET = process.env.JWT_SECRET || "ideail_erp_jwt_secret_key_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

/**
 * Generate a JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Middleware: Verify JWT token from Authorization header
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired. Please login again." });
      }
      return res.status(401).json({ error: "Invalid token." });
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };

    // Record state-changing and data-extraction actions after the response is
    // sent.  This keeps auditing from changing business-route behaviour.
    const isDownload = req.method === "GET" && /\/(download|export)\b/i.test(req.originalUrl || req.url);
    if (!req.auditListenerAttached && (!["GET", "HEAD", "OPTIONS"].includes(req.method) || isDownload)) {
      req.auditListenerAttached = true;
      res.on("finish", () => {
        if (res.statusCode >= 400) return;
        const route = (req.baseUrl || req.originalUrl || "").replace(/^\/api/, "");
        const moduleName = route.split("/").filter(Boolean)[0] || "system";
        const action = isDownload ? "download" : ({ POST: "create", PUT: "update", PATCH: "update", DELETE: "delete" }[req.method] || req.method.toLowerCase());
        db.run(
          `INSERT INTO audit_logs (user_id, action, module, record_id, new_value, ip_address, user_agent)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            action,
            moduleName,
            Number.isInteger(Number(req.params?.id)) ? Number(req.params.id) : null,
            JSON.stringify({ method: req.method, path: req.originalUrl }),
            req.ip,
            req.get("user-agent") || null,
          ],
          () => {}
        );
      });
    }
    next();
  });
}

/**
 * Middleware: Require specific role(s) to access a route
 * Usage: requireRole('admin') or requireRole('admin', 'user')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
        required: roles,
        your_role: req.user.role,
      });
    }

    next();
  };
}

/**
 * Middleware: Optional authentication (doesn't block if no token)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  });
}

module.exports = {
  generateToken,
  authenticateToken,
  requireRole,
  optionalAuth,
  JWT_SECRET,
};
