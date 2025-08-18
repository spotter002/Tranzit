// auth.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized access, please login" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized access, please login" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Debug logging
    console.log("🔑 Decoded token:", decoded);

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Token invalid or expired", error: error.message });
  }
};

/**
 * Middleware to authorize roles
 * - Supports multiple roles
 * - Case-insensitive comparison
 * - Trims accidental spaces
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res
        .status(403)
        .json({ message: "Access denied: No role found in token" });
    }

    const userRole = String(req.user.role).trim().toLowerCase();
    const normalizedRoles = allowedRoles.map((r) =>
      String(r).trim().toLowerCase()
    );

    console.log("🎭 User role:", userRole);
    console.log("✅ Allowed roles:", normalizedRoles);

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied: Your role "${req.user.role}" is not authorized`,
      });
    }

    next();
  };
};

module.exports = { auth, authorizeRoles };
