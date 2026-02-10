const express = require("express");
const router = express.Router();
const {
  getProfile,
  getPublicProfile,
  workerProfile,
  contractorProfile,
  updateUserRole,
  getContractors,
  getWorkers,
} = require("../controllers/user");
const { celebrate, Joi, Segments } = require("celebrate");
const validateJwtToken = require("../middlewares/auth");

module.exports = (app) => {
  router.get("/profile", validateJwtToken, getProfile);

  router.get(
    "/get/:userId",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        userId: Joi.string().required(),
      }),
    }),
    getPublicProfile
  );

  router.put(
    "/update",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        role: Joi.string().required(),
      }),
    }),
    updateUserRole
  );

  router.get("/contractors", validateJwtToken, getContractors);

  router.get(
    "/workers",
    validateJwtToken,
    celebrate({
      [Segments.QUERY]: Joi.object().keys({
        search: Joi.string().optional(),
        rating: Joi.number().optional(),
      }),
    }),
    getWorkers
  );

  router.post(
    "/worker",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        profilePicture: Joi.string().optional(),
        worker: Joi.object({
          title: Joi.string().required(),
          summary: Joi.string().optional(),
          skills: Joi.array().required(),
          tools: Joi.array().optional(),
          certificates: Joi.array().optional(),
          experience: Joi.array().optional(),
          portfolio: Joi.array().optional(),
          hourlyRate: Joi.number().optional(),
          transportation: Joi.boolean().optional(),
        }).required(),
        bankAccount: Joi.object({
          accountNumber: Joi.string().optional(),
          routingNumber: Joi.string().optional(),
          country: Joi.string().optional(),
          currency: Joi.string().optional(),
        }).optional(),
        location: Joi.object({
          street: Joi.string().optional().allow(""),
          city: Joi.string().required(),
          state: Joi.string().required(),
          country: Joi.string().required(),
          postalCode: Joi.number().required(),
        }).required(),
      }),
    }),
    workerProfile
  );

  router.post(
    "/contractor",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        profilePicture: Joi.string().optional(),
        contractor: Joi.object({
          tradeName: Joi.string().required(),
          description: Joi.string().optional(),
          tradeType: Joi.string().optional(),
          documents: Joi.array().optional(),
        }).required(),
        bankAccount: Joi.object({
          accountNumber: Joi.string().optional(),
          routingNumber: Joi.string().optional(),
          country: Joi.string().optional(),
          currency: Joi.string().optional(),
        }).optional(),
        location: Joi.object({
          street: Joi.string().optional().allow(""),
          city: Joi.string().required(),
          state: Joi.string().required(),
          country: Joi.string().required(),
          postalCode: Joi.number().required(),
        }).required(),
      }),
    }),
    contractorProfile
  );

  app.use("/api/v1/user", router);
};
