const express = require("express");
const router = express.Router();
const { getTransactions,updateTransaction, createTransaction } = require("../controllers/transaction");
const validateJwtToken = require("../middlewares/auth");
const { celebrate, Joi, Segments } = require("celebrate");

module.exports = (app) => {
  router.get("/", validateJwtToken, getTransactions);

  router.post(
    "/create",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        amount: Joi.number().min(1).required(),
        paymentId: Joi.string().required(),
      }),
    }),
    createTransaction
  );
  router.put(
    "/update/:_id",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        _id: Joi.string().required(),
      }),
    }),
    updateTransaction
  );

  app.use("/api/v1/transactions", router);
};
