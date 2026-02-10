const { TRANSACTION_METHODS } = require("../constants/modelConstants");
const {
  createPaymentIntent,
  getAccount,
  getBalance,
  getTransfers,
  getCharges,
  createPayout,
  getPayouts,
} = require("../lib/libStripe");
const Fee = require("../model/fee");
const Transaction = require("../model/transaction");

const getWalletBalance = async (req, res) => {
  try {
    const balance = await getBalance({
      account: req.user.account,
    });
    return res.sendResponse({
      data: {
        balance: balance.available[0].amount + balance.pending[0].amount,
      },
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getWalletAccount = async (req, res) => {
  try {
    const account = await getAccount({
      account: req.user.account,
    });
    return res.sendResponse({ data: account });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const addAmountToWallet = async (req, res) => {
  try {
    const payment = await createPaymentIntent({
      account: req.user.account,
      amount: req.body.amount,
    });
   
    return res.sendResponse({ data: { clientSecret: payment.client_secret } });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const withdrawAmount = async (req, res) => {
  try {
    const fee = await Fee.findOne({ _id: "amountWithdrawFee" });
    const chargeAmount =
      req.body.amount - req.body.amount * (fee.percentage / 100);

    const payment = await createPayout({
      account: req.user.account,
      amount: chargeAmount,
      fee: req.body.amount * (fee.percentage / 100),
    });
    await Transaction.create({
      paymentId: payment.id,
      amount: req.body.amount / 100,
      feeAmount: (req.body.amount / 100) * (fee.percentage / 100),
      method: TRANSACTION_METHODS.WITHDRAW_AMOUNT,
      user: req.user._id,
    });
    return res.sendResponse({ data: { payment } });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getAllTransfers = async (req, res) => {
  try {
    const transfers = await getTransfers({
      account: req.user.account,
    });
    return res.sendResponse({ data: { transfers: transfers.data } });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getAllCharges = async (req, res) => {
  try {
    const charges = await getCharges({
      account: req.user.account,
    });
    return res.sendResponse({ data: { charges: charges.data } });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getAllPayouts = async (req, res) => {
  try {
    const payouts = await getPayouts({
      account: req.user.account,
    });
    return res.sendResponse({ data: { payouts: payouts.data } });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

module.exports = {
  getWalletBalance,
  getWalletAccount,
  getAllTransfers,
  getAllCharges,
  addAmountToWallet,
  withdrawAmount,
  getAllPayouts,
};
