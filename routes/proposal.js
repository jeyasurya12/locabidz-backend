const express = require("express");
const router = express.Router();
const { celebrate, Joi, Segments } = require("celebrate");
const { getMyProposals, createProposal, updateProposal, getProposalDetail } = require("../controllers/proposal");
const validateJwtToken = require("../middlewares/auth");

module.exports = (app) => {

  router.get("/get", validateJwtToken, getMyProposals);

  router.post(
    "/create",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        bidAmount: Joi.number().required(),
        deliveredIn: Joi.date().required(),
        proposalText: Joi.string().required(),
        postId: Joi.string().required(),
      }),
    }),
    createProposal
  );

  router.put(
    "/update/:proposalId",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        proposalId: Joi.string().required(),
      }),
      [Segments.BODY]: Joi.object().keys({
        note: Joi.string().required(),
      }),
    }),
    updateProposal
  );

  router.get(
    "/get/:proposalId",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        proposalId: Joi.string().required(),
      }),
    }),
    getProposalDetail
  );

  app.use("/api/v1/proposal", router);
};
