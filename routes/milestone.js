const express = require("express");
const router = express.Router();
const {
  createMilestone,
  releaseMilestonePayment,
  getMilestones
} = require("../controllers/milestone");
const validateJwtToken = require("../middlewares/auth");
const { celebrate, Joi, Segments } = require("celebrate");

module.exports = (app) => {
  router.post(
    "/",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        name: Joi.string().required(),
        amount: Joi.number().required(),
        dueDate: Joi.string().required(),
        description: Joi.string().required(),
        contractId: Joi.string().required(),
        workerId: Joi.string().required(),
      }),
    }),
    createMilestone
  );

  router.post(
    "/release",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        milestoneId: Joi.string().required(),
      }),
    }),
    releaseMilestonePayment
  );

  router.get("/get", validateJwtToken, getMilestones);

  app.use("/api/v1/milestone", router);
};
