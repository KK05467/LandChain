const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

/** Requires a valid Bearer JWT; attaches the user to req.user. */
function protect(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Not authorized. Missing bearer token." });
  
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Not authorized. User no longer exists." });
    }
    req.user = User.toPublic(user);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized. Invalid or expired token." });
  }
}

/** Restricts a route to one or more roles, e.g. requireRole("verifier", "admin"). */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden. Insufficient role." });
    }
    next();
  };
}

module.exports = { protect, requireRole };
