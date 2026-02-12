const express = require("express");

const router = express.Router();
const { stripeWebhook } = require("../controllers/stripe");

module.exports = (app) => {
  router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    stripeWebhook
  );

  app.use("/api/v1/stripe", router);
};
