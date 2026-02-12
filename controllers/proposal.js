const Log = require("../model/log");
const Notification = require("../model/notification");
const Post = require("../model/post");
const Proposal = require("../model/proposal");

const getMyProposals = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const rawLimit = Number(req.query.limit || 20);
    const limit = Math.min(100, Math.max(1, rawLimit));
    const skip = (page - 1) * limit;

    let proposals = await Proposal.find({ proposedBy: req.user._id })
      .populate({
        path: "postId",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return res.sendResponse({
      data: proposals,
    });
  } catch (error) {
    return res.sendError({ message: error.message });
  }
};

const createProposal = async (req, res) => {
  const io = req.app.get("io");
  try {
    const post = await Post.findOne({ _id: req.body.postId });
    const existProposal = await Proposal.findOne({
      proposedBy: req.user._id,
      postId: req.body.postId,
    });
    if (existProposal) {
      return res.sendError({ message: "You cannot propose twice!" });
    }
    if (!post) {
      return res.sendError({ message: "Invalid post" });
    }
    if (`${post.postedBy}` === `${req.user._id}`) {
      return res.sendError({
        message: "You cannot propose to your own post!",
      });
    }
    const proposal = await Proposal.create({
      ...req.body,
      postId: req.body.postId,
      proposedBy: req.user._id,
    });

    await post.updateOne({ $addToSet: { proposals: proposal._id } });
    let updatedPost = await Post.findOne({ _id: req.body.postId })
      .populate({
        path: "attachments",
      })
      .populate({
        path: "proposals",
        populate: {
          path: "proposedBy",
          select: {
            firstName: 1,
            lastName: 1,
            _id: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        populate: {
          path: "chatId",
          select: {
            chatId: 1,
          },
        },
      })
      .populate({
        path: "postedBy",
        select: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      });

    await Notification.create({
      notification: "notification_2",
      user: post.postedBy,
      values: {
        name: post.title,
        userName: req.user.firstName + " " + req.user.lastName,
      },
    });
    io.to(`${post.postedBy}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_NOTIFICTION",
      data: post,
    });
    await Log.create({
      log: "log_10",
      user: req.user._id,
      values: {
        status: "success",
        postId: post.postId,
        proposalId: proposal.proposalId,
      },
    });
    return res.sendResponse({ data: proposal });
  } catch (err) {
    await Log.create({
      log: "log_10",
      user: req.user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({ message: err.message });
  }
};

const updateProposal = async (req, res) => {
  try {
    const proposal = await Proposal.updateOne(
      { _id: req.params.proposalId },
      { note: req.body.note }
    );

    return res.sendResponse({ data: proposal });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getProposalDetail = async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      _id: req.params.proposalId,
    }).populate({
      path: "postId",
      populate: {
        path: "postedBy",
        select: {
          email: 1,
          firstName: 1,
          lastName: 1,
          location: 1,
          totalJobs: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      },
    });
    return res.sendResponse({
      data: proposal,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

module.exports = {
  getMyProposals,
  createProposal,
  updateProposal,
  getProposalDetail,
};
