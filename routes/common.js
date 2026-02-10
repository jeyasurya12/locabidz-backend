const express = require("express");
const router = express.Router();
const {
  getSkills,
  getTools,
  CreateSkill,
  CreateTool,
  getRoles,
  getDefaultData,
  getAllFees,
  updateFee,
  getCountries
} = require("../controllers/common");
const validateJwtToken = require("../middlewares/auth");

const { celebrate, Joi, Segments } = require("celebrate");

module.exports = (app) => {
  router.get(
    "/skills",
    validateJwtToken,
    celebrate({
      [Segments.QUERY]: Joi.object().keys({
        search: Joi.string().optional(),
      }),
    }),
    getSkills
  );

  router.get(
    "/tools",
    validateJwtToken,
    celebrate({
      [Segments.QUERY]: Joi.object().keys({
        search: Joi.string().optional(),
      }),
    }),
    getTools
  );

  router.get("/roles", validateJwtToken, getRoles);

  router.post(
    "/skill",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        name: Joi.string().required(),
      }),
    }),
    CreateSkill
  );

  router.post(
    "/tool",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        name: Joi.string().required(),
      }),
    }),
    CreateTool
  );

  router.get("/fees", validateJwtToken, getAllFees);

  router.post(
    "/fee/:feeId",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        feeId: Joi.string().required(),
      }),
    }),
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        percentage: Joi.number().required(),
      }),
    }),
    updateFee
  );

  router.get("/countries", getCountries);
  router.get("/countries/:country", getCountries);

  router.get("/enums", getDefaultData);

  app.use("/api/v1/common", router);
};
