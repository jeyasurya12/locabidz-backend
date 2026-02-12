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

const requireConnectedAccount = (req, res) => {
  const connectEnabled = process.env.STRIPE_CONNECT_ENABLED === "true";
  if (!connectEnabled) {
    res.sendError({
      message:
        "Stripe Connect is not enabled for this environment. Escrow and withdrawals are unavailable until Stripe Connect is enabled.",
    });
    return false;
  }

  const account = req.user?.account;
  if (typeof account !== "string" || account.trim().length === 0) {
    res.sendError({
      message:
        "Stripe connected account is not configured for this user. Please connect Stripe account.",
    });
    return false;
  }

  return true;
};

const getWalletBalance = async (req, res) => {
  try {
    if (!requireConnectedAccount(req, res)) return;
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
    if (!requireConnectedAccount(req, res)) return;
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
    if (!requireConnectedAccount(req, res)) return;
    const idempotencyKey = req.get("Idempotency-Key");
    const payment = await createPaymentIntent({
      account: req.user.account,
      amount: req.body.amount,
      idempotencyKey: idempotencyKey || undefined,
      metadata: {
        userId: String(req.user._id),
        method: "ADD_AMOUNT",
      },
    });
   
    return res.sendResponse({ data: { clientSecret: payment.client_secret } });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const withdrawAmount = async (req, res) => {
  try {
    if (!requireConnectedAccount(req, res)) return;
    const idempotencyKey = req.get("Idempotency-Key");
    const fee = await Fee.findOne({ _id: "amountWithdrawFee" });
    if (!fee || typeof fee.percentage !== "number") {
      return res.sendError({ message: "Withdraw fee is not configured" });
    }

    // Work in cents (integers) only. Stripe requires integer `amount`.
    const requestedAmount = Number(req.body.amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.sendError({ message: "Invalid amount" });
    }

    const feeAmount = Math.round(requestedAmount * (fee.percentage / 100));
    const chargeAmount = Math.round(requestedAmount - feeAmount);

    if (chargeAmount < 1) {
      return res.sendError({ message: "Amount is too small after fees" });
    }

    const payment = await createPayout({
      account: req.user.account,
      amount: chargeAmount,
      fee: feeAmount,
      idempotencyKey: idempotencyKey || undefined,
    });
    await Transaction.create({
      paymentId: payment.id,
      amount: requestedAmount / 100,
      feeAmount: feeAmount / 100,
      method: TRANSACTION_METHODS.WITHDRAW_AMOUNT,
      status: "pending",
      stripeObjectType: "payout",
      user: req.user._id,
    });
    return res.sendResponse({ data: { payment } });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getAllTransfers = async (req, res) => {
  try {
    if (!requireConnectedAccount(req, res)) return;
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
    if (!requireConnectedAccount(req, res)) return;
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
    if (!requireConnectedAccount(req, res)) return;
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
