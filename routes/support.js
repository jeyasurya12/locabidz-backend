const express = require("express");
const router = express.Router();
const {
  getSupports,
  updateSupport,
  createSupport,
  getCategories,
  createMessage,
  getSupportMessages,
} = require("../controllers/support");
const validateJwtToken = require("../middlewares/auth");
const { celebrate, Joi, Segments } = require("celebrate");
const category = require("../model/category");

module.exports = (app) => {
  router.get("/category", validateJwtToken, getCategories);

  router.get("/", validateJwtToken, getSupports);

  router.get(
    "/get/:supportId",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        supportId: Joi.string().required(),
      }),
    }),
    getSupportMessages
  );

  router.post(
    "/create",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        category: Joi.string().required(),
        subCategory: Joi.string().required(),
        title: Joi.string().optional(),
        description: Joi.string().optional(),
      }),
    }),
    createSupport
  );

  router.post(
    "/message",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        message: Joi.string().required(),
        supportId: Joi.string().required(),
        attachments: Joi.array().default([]),
      }),
    }),
    createMessage
  );

  router.put(
    "/update/:_id",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        _id: Joi.string().required(),
      }),
    }),
    updateSupport
  );

  app.use("/api/v1/support", router);
};
