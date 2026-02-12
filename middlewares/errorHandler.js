const { logger } = require("../utils/logger");

module.exports = function errorHandler(err, req, res, next) {
  if (!err) return next();

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";

  logger.error(
    {
      err,
      statusCode,
      path: req.originalUrl,
      method: req.method,
    },
    "request_error"
  );

  if (typeof res.sendError === "function") {
    return res.sendError({
      statusCode,
      message,
    });
  }

  return res.status(statusCode).json({
    message,
  });
};
