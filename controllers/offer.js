const {
  OFFER_STATUS,
  MILESTONE_STATUS,
  TRANSACTION_METHODS,
} = require("../constants/modelConstants");
const Chat = require("../model/chat");
const Contract = require("../model/contract");
const Message = require("../model/message");
const Notification = require("../model/notification");
const Offer = require("../model/offer");
const Post = require("../model/post");
const Milestone = require("../model/milestone");
const Fee = require("../model/fee");
const { stripeCreateCharge, getBalance } = require("../lib/libStripe");
const User = require("../model/user");
const Transaction = require("../model/transaction");
const Log = require("../model/log");

const createMilestone = async ({
  io,
  amount,
  dueDate,
  description,
  contractId,
  contractorId,
  workerId,
}) => {
  try {
    const worker = await User.findOne({ _id: workerId });
    const contractor = await User.findOne({ _id: contractorId });

    const milestone = await Milestone.create({
      name: "First Milestone",
      amount,
      dueDate,
      description,
      contractId,
      contractorId: contractor.account,
      workerId: worker.account,
      status: MILESTONE_STATUS.PENDING,
    });
    const fee = await Fee.findOne({ _id: "createMilestoneFee" });
    const chargeAmount =
      milestone.amount * 100 + milestone.amount * fee.percentage;
    const charge = await stripeCreateCharge({
      amount: chargeAmount,
      currency: "usd",
      source: milestone.contractorId,
      transfer_group: `group_${milestone.contractorId}`,
      idempotencyKey: `milestone:${milestone._id}:charge`,
    });

    const contract = await Contract.findOne({ _id: contractId });
    await contract.updateOne({ $addToSet: { milestones: milestone._id } });
    await milestone.updateOne({ paymentId: charge.id });

    await Transaction.create({
      paymentId: charge.id,
      amount: milestone.amount,
      feeAmount: milestone.amount * (fee.percentage / 100),
      method: TRANSACTION_METHODS.MILESTONE_CREATE,
      user: contract.members,
    });

    await Notification.create({
      notification: "notification_7",
      user: workerId,
      values: {
        name: milestone.name,
        userName: worker.firstName + " " + worker.lastName,
      },
    });
    io.to(`${workerId}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_NOTIFICTION",
      data: milestone,
    });

    return milestone;
  } catch (err) {
    return err.message;
  }
};

const createOffer = async (req, res) => {
  const io = req.app.get("io");
  try {
    let feeAmount = req.body.bidAmount * (5 / 100);
    let payAmount = req.body.bidAmount - feeAmount;

    const balance = await getBalance({
      account: req.user.account,
    });

    let walletBalance =
      (balance.available[0].amount + balance.pending[0].amount) / 100 >=
      req.body.bidAmount + feeAmount;

    if (!walletBalance) {
      return res.sendError({ message: "Insufficiet balance." });
    }

    const chat = await Chat.findOne({ _id: req.body.chatId }).populate({
      path: "proposalId",
    });

    const offer = await Offer.create({
      ...req.body,
      members: chat.members,
      payAmount,
      status: OFFER_STATUS.PENDING,
    });

    if (!chat.members.includes(`${req.user._id}`)) {
      return res.sendError({ message: "Invalid chat" });
    }

    let message = await Message.create({
      message: req.body.description,
      offerId: offer._id,
      senderId: req.user._id,
      chatId: chat.chatId,
    });
    await chat.updateOne({
      $addToSet: {
        messages: message._id,
      },
      lastMessageId: message._id,
    });
    let newMessage = await Message.findOne({
      _id: message._id,
    })
      .populate({
        path: "attachments",
      })
      .populate({
        path: "offerId",
      })
      .populate({
        path: "senderId",
      });

    chat.members.forEach((member) => {
      io.to(`${member._id}`).emit("RECEIVE_MESSAGE", {
        type: "NEW_CHAT_MESSAGE",
        data: newMessage,
      });
    });

    await Notification.create({
      notification: "notification_4",
      user: chat.proposalId.proposedBy,
      values: {
        name: req.user.firstName + " " + req.user.lastName,
        userName: req.user.firstName + " " + req.user.lastName,
      },
    });
    io.to(`${chat.proposalId.proposedBy}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_NOTIFICTION",
      data: offer,
    });
    const post = await Post.findOne({ _id: chat.proposalId.postId });

    await Log.create({
      log: "log_11",
      user: req.user._id,
      values: {
        status: "success",
        postId: post.postId,
      },
    });
    return res.sendResponse({ data: offer });
  } catch (err) {
    await Log.create({
      log: "log_11",
      user: req.user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({ message: err.message });
  }
};

const updateOffer = async (req, res) => {
  const io = req.app.get("io");
  try {
    await Offer.updateOne({ _id: req.params.offerId }, { ...req.body });
    const offer = await Offer.findOne({ _id: req.params.offerId });
    let contract = {};
    if (req.body.status == OFFER_STATUS.ACCEPTED) {
      contract = await Contract.create({
        offerId: offer._id,
        chatId: offer.chatId,
        members: offer.members,
      });
      const chat = await Chat.findOne({ _id: offer.chatId })
        .populate({
          path: "postId",
        })
        .populate({
          path: "proposalId",
        });
      await Post.updateOne(
        { _id: chat.postId._id },
        {
          acceptedProposal: chat.proposalId._id,
        }
      );
      const milestone = await createMilestone({
        io,
        amount: offer.bidAmount,
        dueDate: chat.proposalId.deliveredIn,
        description: offer.description,
        contractorId: chat.postId.postedBy,
        contractId: contract._id,
        workerId: chat.proposalId.proposedBy,
      });
      await Notification.create({
        notification: "notification_6",
        user: chat.postId.postedBy,
        values: {
          name: req.user.firstName + " " + req.user.lastName,
          userName: req.user.firstName + " " + req.user.lastName,
        },
      });
      io.to(`${chat.postId.postedBy}`).emit("RECEIVE_MESSAGE", {
        type: "NEW_NOTIFICTION",
        data: offer,
      });
      await User.updateOne(
        { _id: chat.postId.postedBy },
        { $inc: { activeJobs: 1 } }
      );
      await User.updateOne(
        { _id: chat.proposalId.proposedBy },
        { $inc: { activeJobs: 1 } }
      );
      const worker = await User.findOne({ _id: chat.proposalId.proposedBy });
      await Log.create({
        log: "log_12",
        user: worker._id,
        values: {
          status: "success",
          postId: chat.postId.postId,
          milestoneId: milestone.milestoneId,
        },
      });
    }
    const chat = await Chat.findOne({ _id: offer.chatId }).populate({
      path: "postId",
    });
    await Notification.create({
      notification: "notification_5",
      user: chat.postId.postedBy,
      values: {
        name: req.user.firstName + " " + req.user.lastName,
        userName: req.user.firstName + " " + req.user.lastName,
      },
    });
    io.to(`${chat.postId.postedBy}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_NOTIFICTION",
      data: offer,
    });
    return res.sendResponse({ data: contract?._id != null ? contract : offer });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getOffer = async (req, res) => {
  try {
    const offer = await Offer.findOne({ _id: req.params.offerId }).populate({
      path: "chatId",
      populate: [
        {
          path: "postId",
        },
        {
          path: "proposalId",
        },
      ],
    });
    return res.sendResponse({ data: offer });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

module.exports = {
  createOffer,
  updateOffer,
  getOffer,
};
