const {
  MILESTONE_STATUS,
  TRANSACTION_METHODS,
} = require("../constants/modelConstants");
const {
  stripeCreateCharge,
  stripeTransfer,
  getBalance,
} = require("../lib/libStripe");
const mongoose = require("mongoose");
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

const toCents = (amount) => {
  const num = Number(amount);
  if (!Number.isFinite(num)) {
    throw new Error("Invalid amount");
  }
  return Math.round(num * 100);
};

const calcFeeCents = (amountCents, percentage) => {
  if (!Number.isFinite(percentage)) return 0;
  return Math.max(0, Math.round((amountCents * percentage) / 100));
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
    if (!fee || typeof fee.percentage !== "number") {
      return res.sendError({ message: "Create milestone fee configuration missing." });
    }

    const amountCents = toCents(req.body.amount);
    const feeCents = calcFeeCents(amountCents, fee.percentage);
    const chargeAmount = amountCents + feeCents;

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
      feeAmount: feeCents / 100,
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

  let session;
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

    const hasDestination =
      typeof milestone.workerId === "string" && milestone.workerId.trim().length > 0;
    if (!hasDestination) {
      return res.sendError({
        message: "Worker payout account is not connected. Please connect Stripe account.",
      });
    }

    const fee = await Fee.findOne({ _id: "releaseMilestoneFee" });
    if (!fee || typeof fee.percentage !== "number") {
      return res.sendError({ message: "Release milestone fee configuration missing." });
    }

    const amountCents = toCents(milestone.amount);
    const feeCents = calcFeeCents(amountCents, fee.percentage);
    const transferAmount = amountCents - feeCents;
    if (transferAmount <= 0) {
      return res.sendError({ message: "Calculated transfer amount is invalid." });
    }

    const workerQuery = connectEnabled ? { account: milestone.workerId } : { _id: milestone.workerId };
    const worker = await User.findOne(workerQuery);
    if (!worker) {
      return res.sendError({ message: "Worker not found." });
    }

    if (connectEnabled) {
      try {
        assertStripeConnectOnboarded(worker, "Worker");
      } catch (stripeErr) {
        return res.sendError({ message: getStripeErrorMessage(stripeErr) });
      }
    }

    let transfer = null;
    if (connectEnabled) {
      transfer = await stripeTransfer({
        amount: transferAmount,
        currency: "usd",
        destination: milestone.workerId,
        source: milestone.paymentId,
        transfer_group: `group_${milestone.contractorId}`,
        idempotencyKey: idempotencyKey || undefined,
      });
    }

    session = await mongoose.startSession();
    let releasedNow = false;
    await session.withTransaction(async () => {
      const freshMilestone = await Milestone.findOne({ _id: milestone._id }).session(session);
      if (!freshMilestone) {
        throw new Error("Milestone not found.");
      }
      if (freshMilestone.status === MILESTONE_STATUS.RELEASED) {
        return;
      }

      const contractorQuery = connectEnabled
        ? { account: freshMilestone.contractorId }
        : { _id: freshMilestone.contractorId };

      const contractor = await User.findOne(contractorQuery).session(session);
      if (!contractor) {
        throw new Error("Contractor not found.");
      }

      const debitAmount = freshMilestone.amount;
      if (!connectEnabled) {
        const debit = await User.updateOne(
          { _id: contractor._id, totalEarnings: { $gte: debitAmount } },
          { $inc: { totalEarnings: -debitAmount } },
          { session }
        );

        if (!debit.modifiedCount) {
          throw new Error("Insufficient contractor wallet balance.");
        }
      }

      const creditAmount = transferAmount / 100;
      await User.updateOne(
        { _id: worker._id },
        { $inc: { totalEarnings: creditAmount } },
        { session }
      );

      await Milestone.updateOne(
        { _id: freshMilestone._id, status: MILESTONE_STATUS.PENDING },
        { status: MILESTONE_STATUS.RELEASED },
        { session }
      );

      const contract = await Contract.findOne({
        _id: freshMilestone.contractId,
      })
        .populate({
          path: "chatId",
          populate: {
            path: "postId",
          },
        })
        .session(session);

      await Transaction.create(
        [
          {
            paymentId: transfer?.id || freshMilestone.paymentId || `milestone:${freshMilestone._id}:release`,
            amount: freshMilestone.amount,
            feeAmount: feeCents / 100,
            method: TRANSACTION_METHODS.MILESTONE_RELEASE,
            status: "completed",
            stripeObjectType: transfer?.object || null,
            user: contract ? contract.members : [contractor._id, worker._id],
          },
        ],
        { session }
      );

      releasedNow = true;
    });

    if (releasedNow) {
      await Notification.create({
        notification: "notification_8",
        user: worker._id,
        values: {
          name: milestone.name,
          userName: req.user.firstName + " " + req.user.lastName,
        },
      });
      io.to(`${worker._id}`).emit("RECEIVE_MESSAGE", {
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
    } else if (transfer?.id) {
      // If transfer succeeded but milestone was already released in-session, we do not notify twice.
      // Idempotency on Stripe side should prevent double payout.
    }

    return res.sendResponse({ data: milestone });
  } catch (err) {
    const milestone = await Milestone.findOne({ _id: req.body.milestoneId });
    await Log.create({
      log: "log_13",
      user: req.user._id,
      values: {
        milestoneId: milestone?.milestoneId,
        status: "failed",
      },
    });
    return res.sendError({ message: getStripeErrorMessage(err) });
  } finally {
    if (session) {
      await session.endSession();
    }
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
