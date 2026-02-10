const express = require("express");
const router = express.Router();
const { getMyContracts, getContract, completeContract } = require("../controllers/contract");
const validateJwtToken = require("../middlewares/auth");
const { celebrate, Joi, Segments } = require("celebrate");

module.exports = (app) => {
  router.get("/", validateJwtToken, getMyContracts);

  router.get(
    "/get/:contractId",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        contractId: Joi.string().required(),
      }),
    }),
    getContract
  );

  router.put(
    "/complete",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        contractId: Joi.string().required(),
      }),
    }),
    completeContract
  );

  app.use("/api/v1/contract", router);
};
