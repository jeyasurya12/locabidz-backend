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

const getStripeErrorMessage = (err) => {
  if (!err) return "An error occurred";
  const rawMessage = err?.raw?.message;
  const rawParam = err?.raw?.param;
  if (typeof rawMessage === "string" && rawMessage.trim().length > 0) {
    return typeof rawParam === "string" && rawParam.trim().length > 0
      ? `${rawMessage} (param: ${rawParam})`
      : rawMessage;
  }
  if (typeof err.message === "string" && err.message.trim().length > 0) {
    return err.message;
  }
  return "An error occurred";
};

const assertStripeConnectOnboarded = (user, roleLabel) => {
  const accountId = user?.account;
  if (typeof accountId !== "string" || accountId.trim().length === 0) {
    const err = new Error(
      `${roleLabel} payout account is not connected. Please connect Stripe account.`
    );
    err.statusCode = 400;
    throw err;
  }

  const onboardingComplete = user?.stripeOnboardingComplete === true;
  if (!onboardingComplete) {
    const err = new Error(
      `${roleLabel} Stripe onboarding is not completed. Please complete Stripe onboarding.`
    );
    err.statusCode = 403;
    throw err;
  }

  return accountId.trim();
};

const createMilestone = async (req, res) => {
  const io = req.app.get("io");
  try {
    const connectEnabled = process.env.STRIPE_CONNECT_ENABLED === "true";
    const idempotencyKey = req.get("Idempotency-Key");

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const isTestMode = typeof stripeKey === "string" && stripeKey.startsWith("sk_test_");
    const isLiveMode = typeof stripeKey === "string" && stripeKey.startsWith("sk_live_");

    const rawLink = req.body?.link;
    const link = typeof rawLink === "string" && rawLink.trim().length === 0 ? null : rawLink;
    if (typeof link === "string") {
      try {
        const parsed = new URL(link);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return res.sendError({ message: "Invalid link URL" });
        }
      } catch {
        return res.sendError({ message: "Invalid link URL" });
      }
    }

    let contractorAccount = req.user?.account;
    if (connectEnabled) {
      contractorAccount = assertStripeConnectOnboarded(req.user, "Contractor");
    } else {
      if (typeof contractorAccount !== "string" || contractorAccount.trim().length === 0) {
        contractorAccount = String(req.user._id);
      }
    }

    if (!connectEnabled) {
      const milestone = await Milestone.create({
        ...req.body,
        link,
        contractorId: String(req.user._id),
        workerId: String(req.body.workerId),
        status: MILESTONE_STATUS.PENDING,
      });

      await Contract.updateOne(
        { _id: req.body.contractId },
        { $addToSet: { milestones: milestone._id } }
      );

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
          milestoneId: milestone.milestoneId,
        },
      });

      return res.sendResponse({ data: milestone });
    }

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
    if (!worker) {
      return res.sendError({ message: "Worker not found." });
    }

    let workerAccount = worker?.account;
    if (connectEnabled) {
      try {
        workerAccount = assertStripeConnectOnboarded(worker, "Worker");
      } catch (stripeErr) {
        return res.sendError({ message: getStripeErrorMessage(stripeErr) });
      }
    } else {
      if (typeof workerAccount !== "string" || workerAccount.trim().length === 0) {
        workerAccount = String(worker._id);
      }
    }

    const milestone = await Milestone.create({
      ...req.body,
      link,
      contractorId: contractorAccount,
      workerId: workerAccount,
      status: MILESTONE_STATUS.PENDING,
    });

    const paymentSource = isTestMode
      ? "tok_visa"
      : typeof req.body.paymentSource === "string" && req.body.paymentSource.trim().length > 0
        ? req.body.paymentSource.trim()
        : null;

    if (!paymentSource && isLiveMode) {
      return res.sendError({
        message:
          "paymentSource is required in live mode (card token/payment method id).",
      });
    }

    if (!paymentSource && !isTestMode) {
      return res.sendError({ message: "Unable to determine payment source" });
    }

    const charge = await stripeCreateCharge({
      amount: chargeAmount,
      currency: "usd",
      source: paymentSource,
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
    return res.sendError({ message: getStripeErrorMessage(err) });
  }
};

const releaseMilestonePayment = async (req, res) => {
  const io = req.app.get("io");

  try {
    const connectEnabled = process.env.STRIPE_CONNECT_ENABLED === "true";
    const idempotencyKey = req.get("Idempotency-Key");
    if (connectEnabled) {
      try {
        assertStripeConnectOnboarded(req.user, "Contractor");
      } catch (stripeErr) {
        return res.sendError({ message: getStripeErrorMessage(stripeErr) });
      }
    }
    const milestone = await Milestone.findOne({ _id: req.body.milestoneId });
    if (!milestone) {
      return res.sendError({ message: "Milestone not found." });
    }
    if (milestone.status === MILESTONE_STATUS.RELEASED) {
      return res.sendError({ message: "Milestone already released." });
    }

    if (!connectEnabled) {
      await milestone.updateOne({ status: MILESTONE_STATUS.RELEASED });

      await Notification.create({
        notification: "notification_8",
        user: milestone.workerId,
        values: {
          name: milestone.name,
          userName: req.user.firstName + " " + req.user.lastName,
        },
      });
      io.to(`${milestone.workerId}`).emit("RECEIVE_MESSAGE", {
        type: "NEW_NOTIFICTION",
        data: milestone,
      });

      await Log.create({
        log: "log_13",
        user: req.user._id,
        values: {
          status: "success",
          milestoneId: milestone.milestoneId,
        },
      });

      return res.sendResponse({ data: milestone });
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

    if (!user) {
      return res.sendError({ message: "Worker not found." });
    }

    try {
      assertStripeConnectOnboarded(user, "Worker");
    } catch (stripeErr) {
      return res.sendError({ message: getStripeErrorMessage(stripeErr) });
    }

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
    const connectEnabled = process.env.STRIPE_CONNECT_ENABLED === "true";
    const milestones = await Milestone.find({
      $or: connectEnabled
        ? [{ contractorId: req.user.account }, { workerId: req.user.account }]
        : [{ contractorId: String(req.user._id) }, { workerId: String(req.user._id) }],
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
