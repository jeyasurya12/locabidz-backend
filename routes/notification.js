const express = require("express");
const router = express.Router();
const { getNotifications,updateNotification, clearNotification } = require("../controllers/notification");
const validateJwtToken = require("../middlewares/auth");
const { celebrate, Joi, Segments } = require("celebrate");

module.exports = (app) => {
  router.get("/get", validateJwtToken, getNotifications);

  router.put(
    "/update/:_id",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        _id: Joi.string().required(),
      }),
    }),
    updateNotification
  );

  router.post(
    "/clear",
    validateJwtToken,
    clearNotification
  );

  app.use("/api/v1/notification", router);
};
