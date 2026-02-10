const express = require("express");
const router = express.Router();
const {
  getWalletBalance,
  getWalletAccount,
  getAllTransfers,
  getAllCharges,
  addAmountToWallet,
  withdrawAmount,
  getAllPayouts
} = require("../controllers/wallet");
const { celebrate, Joi, Segments } = require("celebrate");
const validateJwtToken = require("../middlewares/auth");

module.exports = (app) => {
  
  router.get("/balance", validateJwtToken, getWalletBalance);

  router.get("/account", validateJwtToken, getWalletAccount);

  router.get("/transfers", validateJwtToken, getAllTransfers);

  router.get("/charges", validateJwtToken, getAllCharges);

  router.get("/payouts", validateJwtToken, getAllPayouts);

  router.post(
    "/add-amount",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        amount: Joi.number().min(1).required(),
      }),
    }),
    addAmountToWallet
  );

  router.post(
    "/withdraw",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        amount: Joi.number().min(1).required(),
      }),
    }),
    withdrawAmount
  );

  app.use("/api/v1/wallet", router);
};
