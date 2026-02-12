const {
  MILESTONE_STATUS,
  TRANSACTION_METHODS,
} = require("../constants/modelConstants");
const {
  stripeCreateCharge,
  stripeTransfer,
  getBalance,
} = require("../lib/libStripe");
const Contract = require("../model/contract");
const Fee = require("../model/fee");
const Log = require("../model/log");
const Milestone = require("../model/milestone");
const Notification = require("../model/notification");
const Transaction = require("../model/transaction");
const User = require("../model/user");

const createMilestone = async (req, res) => {
  const io = req.app.get("io");
  try {
    const idempotencyKey = req.get("Idempotency-Key");
    const fee = await Fee.findOne({ _id: "createMilestoneFee" });
    const chargeAmount =
      req.body.amount * 100 + req.body.amount * fee.percentage;

    const balance = await getBalance({
      account: req.user.account,
    });

    let walletBalance =
      (balance.available[0].amount + balance.pending[0].amount) / 100 >=
      chargeAmount / 100;

    if (!walletBalance) {
      return res.sendError({ message: "Insufficiet balance." });
    }
    const worker = await User.findOne({ _id: req.body.workerId });

    const milestone = await Milestone.create({
      ...req.body,
      contractorId: req.user.account,
      workerId: worker.account,
      status: MILESTONE_STATUS.PENDING,
    });

    const charge = await stripeCreateCharge({
      amount: chargeAmount,
      currency: "usd",
      source: milestone.contractorId,
      transfer_group: `group_${milestone.contractorId}`,
      idempotencyKey: idempotencyKey || undefined,
    });

    const contract = await Contract.findOne({
      _id: req.body.contractId,
    }).populate({
      path: "chatId",
      populate: {
        path: "postId",
      },
    });
    await contract.updateOne({ $addToSet: { milestones: milestone._id } });
    await milestone.updateOne({ paymentId: charge.id });
    await Transaction.create({
      paymentId: charge.id,
      amount: req.body.amount,
      feeAmount: req.body.amount * (fee.percentage / 100),
      method: TRANSACTION_METHODS.MILESTONE_CREATE,
      user: contract.members,
    });
    await Notification.create({
      notification: "notification_7",
      user: req.body.workerId,
      values: {
        name: milestone.name,
        userName: req.user.firstName + " " + req.user.lastName,
      },
    });
    io.to(`${req.body.workerId}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_NOTIFICTION",
      data: milestone,
    });

    await Log.create({
      log: "log_12",
      user: req.user._id,
      values: {
        status: "success",
        postId: contract.chatId.postId.postId,
        milestoneId: milestone.milestoneId,
      },
    });
    return res.sendResponse({ data: milestone });
  } catch (err) {
    await Log.create({
      log: "log_12",
      user: req.user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({ message: err.message });
  }
};

const releaseMilestonePayment = async (req, res) => {
  const io = req.app.get("io");

  try {
    const idempotencyKey = req.get("Idempotency-Key");
    const milestone = await Milestone.findOne({ _id: req.body.milestoneId });
    if (!milestone) {
      return res.sendError({ message: "Milestone not found." });
    }
    if (milestone.status === MILESTONE_STATUS.RELEASED) {
      return res.sendError({ message: "Milestone already released." });
    }

    const hasDestination =
      typeof milestone.workerId === "string" &&
      milestone.workerId.trim().length > 0;
    if (!hasDestination) {
      return res.sendError({
        message: "Worker payout account is not connected. Please connect Stripe account.",
      });
    }
    const fee = await Fee.findOne({ _id: "releaseMilestoneFee" });

    const transferAmount =
      milestone.amount * 100 - milestone.amount * fee.percentage;
    const transfer = await stripeTransfer({
      amount: transferAmount,
      currency: "usd",
      destination: milestone.workerId,
      source: milestone.paymentId,
      transfer_group: `group_${milestone.contractorId}`,
      idempotencyKey: idempotencyKey || undefined,
    });

    const user = await User.findOne({
      account: milestone.workerId,
    });

    await user.updateOne({
      totalEarnings: user.totalEarnings + transferAmount / 100,
    });

    await milestone.updateOne({ status: MILESTONE_STATUS.RELEASED });

    await Notification.create({
      notification: "notification_8",
      user: user._id,
      values: {
        name: milestone.name,
        userName: req.user.firstName + " " + req.user.lastName,
      },
    });
    io.to(`${user._id}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_NOTIFICTION",
      data: milestone,
    });
    const contract = await Contract.findOne({
      _id: milestone.contractId,
    }).populate({
      path: "chatId",
      populate: {
        path: "postId",
      },
    });
    await Transaction.create({
      paymentId: transfer.id,
      amount: milestone.amount,
      feeAmount: milestone.amount * (fee.percentage / 100),
      method: TRANSACTION_METHODS.MILESTONE_RELEASE,
      user: contract.members,
    });
    await Log.create({
      log: "log_13",
      user: req.user._id,
      values: {
        status: "success",
        postId: contract.chatId.postId.postId,
        milestoneId: milestone.milestoneId,
      },
    });
    return res.sendResponse({ data: milestone });
  } catch (err) {
    const milestone = await Milestone.findOne({ _id: req.body.milestoneId });
    await Log.create({
      log: "log_13",
      user: req.user._id,
      values: {
        milestoneId: milestone.milestoneId,
        status: "failed",
      },
    });
    return res.sendError({ message: err.message });
  }
};

const getMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.find({
      $or: [{ contractorId: req.user.account }, { workerId: req.user.account }],
      status: MILESTONE_STATUS.PENDING,
    }).sort({ updatedAt: -1 });
    return res.sendResponse({ data: milestones });
  } catch (err) {
    return res.sendError({ success: false, message: err.message });
  }
};

module.exports = {
  createMilestone,
  releaseMilestonePayment,
  getMilestones,
};
