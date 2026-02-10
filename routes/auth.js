const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  verifyEmail,
  resendEmail,
  forgotPassword,
  updatePassword,
  verifyOtp,
} = require("../controllers/auth");

const { celebrate, Joi, errors, Segments } = require("celebrate");
const { stripeOnboardLink } = require("../controllers/wallet");
const strongPasswordRegex =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
const stringPassswordError =
  "Password must be strong. At least one upper case alphabet. At least one lower case alphabet. At least one digit. At least one special character. Minimum eight in length";

module.exports = (app) => {
  router.get(
    "/verify-email/:verifyToken",
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        verifyToken: Joi.string().required(),
      }),
    }),
    verifyEmail
  );

  router.post(
    "/resendEmail",
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        email: Joi.string().required(),
      }),
    }),
    resendEmail
  );

  router.post(
    "/forgot-password",
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required(),
      }),
    }),
    forgotPassword
  );

  router.post(
    "/update-password",
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        newPassword: Joi.string()
          .regex(strongPasswordRegex)
          .message(stringPassswordError)
          .required(),
        forgotPasswordToken: Joi.string().required(),
      }),
    }),
    updatePassword
  );

  router.post(
    "/verify-otp",
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        forgotPasswordToken: Joi.string().required(),
      }),
    }),
    verifyOtp
  );

  router.post(
    "/signup",
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        countryCode: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      }),
    }),
    signup
  );

  router.post(
    "/",
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      }),
    }),
    login
  );

  app.use("/api/v1/auth", router);
};
