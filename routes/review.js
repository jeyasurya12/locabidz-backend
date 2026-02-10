const express = require("express");
const router = express.Router();
const { getReviews, createReview } = require("../controllers/review");
const { celebrate, Joi, Segments } = require("celebrate");
const validateJwtToken = require("../middlewares/auth");

module.exports = (app) => {
  
  router.get(
    "/get/:userId",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        userId: Joi.string().required(),
      }),
    }),
    getReviews
  );

  router.post(
    "/create",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        starCount: Joi.number().min(1).max(5).required(),
        review: Joi.string().required(),
        postId: Joi.string().required(),
        userId: Joi.string().required(),
        contractId: Joi.string().required(),
      }),
    }),
    createReview
  );

  app.use("/api/v1/review", router);
};
