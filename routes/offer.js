const express = require("express");
const router = express.Router();
const { createOffer, getOffer, updateOffer } = require("../controllers/offer");
const validateJwtToken = require("../middlewares/auth");
const { celebrate, Joi, Segments } = require("celebrate");

module.exports = (app) => {
    
  router.post(
    "/",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        bidAmount: Joi.number().required(),
        type: Joi.string().required(),
        description: Joi.string().required(),
        chatId: Joi.string().required(),
      }),
    }),
    createOffer
  );

  router.put(
    "/update/:offerId",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        offerId: Joi.string().required(),
      }),
      [Segments.BODY]: Joi.object().keys({
        status: Joi.number().required(),
        message: Joi.string().optional(),
      }),
    }),
    updateOffer
  );

  router.get(
    "/get/:offerId",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        offerId: Joi.string().required(),
      }),
    }),
    getOffer
  );

  app.use("/api/v1/offer", router);
};
