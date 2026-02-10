const {
  MILESTONE_STATUS,
  TRANSACTION_METHODS,
} = require("../constants/modelConstants");
const { stripeCreateCharge, stripeTransfer } = require("../lib/libStripe");
const Contract = require("../model/contract");
const Fee = require("../model/fee");
const Milestone = require("../model/milestone");
const Transaction = require("../model/transaction");
const User = require("../model/user");

const getTransactions = async (req, res) => {
  try {
    const notifications = await Transaction.find({
      isActive: true,
      user: req.user._id,
    }).sort({ createdAt: -1 });
    return res.sendResponse({
      data: notifications,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const createTransaction = async (req, res) => {
  try {
    const result = await Transaction.create({
      paymentId: req.body.paymentId,
      amount: req.body.amount,
      method: TRANSACTION_METHODS.ADD_AMOUNT,
      user: req.user._id,
    });
    return res.sendResponse({ data: result });
  } catch (error) {
    return res.sendError({ message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  const { _id } = req.params;
  try {
    const msg = await Transaction.findOne({ _id: _id });

    const result = await Transaction.updateMany({ _id: _id }, { isRead: true });

    return res.sendResponse({ data: result });
  } catch (error) {
    return res.sendError({ message: error.message });
  }
};

module.exports = {
  getTransactions,
  updateTransaction,
  createTransaction,
};
