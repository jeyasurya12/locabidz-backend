const {
  OFFER_STATUS,
  MILESTONE_STATUS,
} = require("../constants/modelConstants");
const User = require("../model/user");
const Contract = require("../model/contract");

const getMyContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({ members: { $in: req.user._id } })
      .populate({
        path: "offerId",
      })
      .populate({
        path: "members",
        select: {
          firstName: 1,
          lastName: 1,
          role: 1,
          _id: 1,
          updatedAt: 1,
        },
      })
      .populate({
        path: "chatId",
        populate: [
          {
            path: "postId",
          },
          {
            path: "proposalId",
          },
        ],
      })
      .sort({ createdAt: -1 });
    return res.sendResponse({ data: contracts });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getContract = async (req, res) => {
  try {
    const contract = await Contract.findOne({ _id: req.params.contractId })
      .populate({
        path: "offerId",
      })
      .populate({
        path: "milestones",
      })
      .populate({
        path: "members",
        select: {
          firstName: 1,
          lastName: 1,
          role: 1,
          _id: 1,
          updatedAt: 1,
        },
      })
      .populate({
        path: "chatId",
        populate: [
          {
            path: "postId",
            populate: {
              path: "skills",
            },
          },
          {
            path: "proposalId",
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
          },
        ],
      });
    return res.sendResponse({ data: contract });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const completeContract = async (req, res) => {
  try {
    const _id = req.body.contractId;
    await Contract.updateOne({ _id: _id }, { isCompleted: true });

    const contract = await Contract.findOne({ _id: _id });

    contract.members.forEach(async (member) => {
      await User.updateOne(
        { _id: member },
        { $inc: { activeJobs: -1, completedJobs: 1 } }
      );
      // io.to(`${member._id}`).emit("RECEIVE_MESSAGE", {
      //   type: "NEW_CHAT_MESSAGE",
      //   data: newMessage,
      // });
    });
    return res.sendResponse({ message: "Updated Succesfully!" });
  } catch (error) {
    await Log.create({
      log: "log_9",
      user: req.user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({ message: error.message });
  }
};

module.exports = {
  getMyContracts,
  getContract,
  completeContract,
};
