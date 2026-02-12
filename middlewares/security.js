const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const compression = require("compression");

const parseAllowedOrigins = (value) => {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const createCorsMiddleware = () => {
  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGINS);

  if (allowedOrigins.length === 0) {
    return cors();
  }

  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS origin not allowed"));
    },
    credentials: true,
  });
};

const createApiLimiter = () => {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const max = Number(process.env.RATE_LIMIT_MAX || 300);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const applySecurityMiddleware = (app) => {
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(compression());
  app.use(createCorsMiddleware());
  app.use(createApiLimiter());

  app.use(
    mongoSanitize({
      allowDots: true,
      replaceWith: "_",
    })
  );

  app.use(hpp());
};

module.exports = {
  applySecurityMiddleware,
};
