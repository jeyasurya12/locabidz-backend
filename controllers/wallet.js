const { TRANSACTION_METHODS } = require("../constants/modelConstants");
const mongoose = require("mongoose");
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
const User = require("../model/user");

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
    const user = await User.findOne({ _id: req.user._id }).select({
      totalEarnings: 1,
    });

    if (!user) {
      return res.sendError({ message: "User not found" });
    }

    return res.sendResponse({
      data: {
        balance: user.totalEarnings,
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
    const idempotencyKey = req.get("Idempotency-Key");

    const requestedAmount = Number(req.body.amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.sendError({ message: "Invalid amount" });
    }

    const amount = Math.round(requestedAmount * 100) / 100;
    if (amount <= 0) {
      return res.sendError({ message: "Invalid amount" });
    }

    const session = await mongoose.startSession();
    let out = null;

    try {
      await session.withTransaction(async () => {
        const paymentId =
          typeof idempotencyKey === "string" && idempotencyKey.trim().length > 0
            ? `add-amount:${idempotencyKey.trim()}`
            : undefined;

        if (paymentId) {
          const existing = await Transaction.findOne({
            paymentId,
            method: TRANSACTION_METHODS.ADD_AMOUNT,
          }).session(session);

          if (existing) {
            const user = await User.findOne({ _id: req.user._id })
              .select({ totalEarnings: 1 })
              .session(session);
            out = { transaction: existing, walletBalance: user?.totalEarnings };
            return;
          }
        }

        const updatedUser = await User.findOneAndUpdate(
          { _id: req.user._id },
          {
            $inc: {
              totalEarnings: amount,
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedUser) {
          throw new Error("User not found");
        }

        const transaction = await Transaction.create(
          [
            {
              paymentId,
              amount,
              feeAmount: 0,
              method: TRANSACTION_METHODS.ADD_AMOUNT,
              status: "completed",
              stripeObjectType: null,
              user: [req.user._id],
            },
          ],
          { session }
        );

        out = {
          transaction: Array.isArray(transaction) ? transaction[0] : transaction,
          walletBalance: updatedUser.totalEarnings,
        };
      });
    } finally {
      await session.endSession();
    }

    return res.sendResponse({ data: out });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const withdrawAmount = async (req, res) => {
  try {
    const idempotencyKey = req.get("Idempotency-Key");

    const requestedAmount = Number(req.body.amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.sendError({ message: "Invalid amount" });
    }

    const amount = Math.round(requestedAmount * 100) / 100;
    if (amount <= 0) {
      return res.sendError({ message: "Invalid amount" });
    }

    const fee = await Fee.findOne({ _id: "amountWithdrawFee" });
    if (!fee || typeof fee.percentage !== "number") {
      return res.sendError({ message: "Withdraw fee is not configured" });
    }

    const feeAmount = Math.round(amount * (fee.percentage / 100) * 100) / 100;
    const netAmount = Math.round((amount - feeAmount) * 100) / 100;
    if (netAmount <= 0) {
      return res.sendError({ message: "Amount is too small after fees" });
    }

    const session = await mongoose.startSession();
    let out = null;

    try {
      await session.withTransaction(async () => {
        const paymentId =
          typeof idempotencyKey === "string" && idempotencyKey.trim().length > 0
            ? `withdraw:${idempotencyKey.trim()}`
            : undefined;

        if (paymentId) {
          const existing = await Transaction.findOne({
            paymentId,
            method: TRANSACTION_METHODS.WITHDRAW_AMOUNT,
          }).session(session);
          if (existing) {
            const user = await User.findOne({ _id: req.user._id })
              .select({ totalEarnings: 1 })
              .session(session);
            out = { transaction: existing, walletBalance: user?.totalEarnings };
            return;
          }
        }

        const updatedUser = await User.findOneAndUpdate(
          {
            _id: req.user._id,
            totalEarnings: { $gte: amount },
          },
          {
            $inc: {
              totalEarnings: -amount,
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedUser) {
          throw new Error("Insufficiet balance.");
        }

        const transaction = await Transaction.create(
          [
            {
              paymentId,
              amount,
              feeAmount,
              method: TRANSACTION_METHODS.WITHDRAW_AMOUNT,
              status: "pending",
              stripeObjectType: null,
              user: [req.user._id],
            },
          ],
          { session }
        );

        out = {
          transaction: Array.isArray(transaction) ? transaction[0] : transaction,
          walletBalance: updatedUser.totalEarnings,
          netAmount,
        };
      });
    } finally {
      await session.endSession();
    }

    return res.sendResponse({ data: out });
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
