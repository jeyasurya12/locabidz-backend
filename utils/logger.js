const pino = require("pino");
const pinoHttp = require("pino-http");

const isProd = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.newPassword",
      "req.body.forgotPasswordToken",
    ],
    censor: "[REDACTED]",
  },
});

const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === "/health",
  },
  redact: ["req.headers.authorization", "req.headers.cookie"],
});

module.exports = {
  logger,
  httpLogger,
};
