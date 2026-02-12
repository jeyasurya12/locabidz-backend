module.exports = function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return function (req, res, next) {
    const role = req.user && req.user.role;

    if (!role) {
      if (typeof res.sendError === "function") {
        return res.sendError({ statusCode: 403, message: "Forbidden" });
      }
      return res.status(403).json({ message: "Forbidden" });
    }

    if (allowed.length > 0 && !allowed.includes(role)) {
      if (typeof res.sendError === "function") {
        return res.sendError({ statusCode: 403, message: "Forbidden" });
      }
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
};
