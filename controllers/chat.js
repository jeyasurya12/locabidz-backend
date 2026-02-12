const Chat = require("../model/chat");
const Message = require("../model/message");
const Proposals = require("../model/proposal");
const Post = require("../model/post");
const Contract = require("../model/contract");
const Notification = require("../model/notification");

const getChatId = (sender, receiver) => {
  return [`${sender}`, `${receiver}`]
    .sort((a, b) => a.localeCompare(b))
    .join("-");
};

const createChat = async (req, res) => {
  const io = req.app.get("io");

  const proposal = await Proposals.findOne({
    _id: req.body.proposalId,
  });

  try {
    let chat = await Chat.findOne({
      chatId: getChatId(req.user._id, proposal.proposedBy),
    });

    if (!chat) {
      chat = await Chat.create({
        postId: req.body.postId,
        proposalId: req.body.proposalId,
        chatId: getChatId(req.user._id, proposal.proposedBy),
        members: [`${req.user._id}`, `${proposal.proposedBy}`],
      });
      await Notification.create({
        notification: "notification_3",
        user: proposal.proposedBy,
        values: {
          name: req.user.firstName + " " + req.user.lastName,
          userName: req.user.firstName + " " + req.user.lastName,
        },
      });
      io.to(`${proposal.proposedBy}`).emit("RECEIVE_MESSAGE", {
        type: "NEW_NOTIFICTION",
        data: chat,
      });
    } else if (`${chat.postId}` !== `${req.body.postId}`) {
      await chat.updateOne({
        postId: req.body.postId,
      });
    }
    let newChat = await Chat.findOne({
      chatId: getChatId(req.user._id, proposal.proposedBy),
    })
      .populate({
        path: "members",
        select: {
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
        },
      })
      .populate({
        path: "lastMessageId",
      })
      .populate({
        path: "postId",
      })
      .populate({
        path: "attachments",
      });
    await proposal.updateOne({
      chatId: chat._id,
    });
    newChat.members.forEach((mem) => {
      io.to(`${mem._id}`).emit("RECEIVE_MESSAGE", {
        type: "UPDATE_CHAT",
        data: {
          ...newChat.toObject(),
          receiver: newChat.members.find(
            (member) => `${member._id}` !== `${mem._id}`
          ),
        },
      });
    });
    return res.sendResponse({
      data: {
        ...newChat.toObject(),
        receiver: newChat.members.find(
          (member) => `${member._id}` !== `${req.user._id}`
        ),
      },
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const messageCreate = async ({
  io,
  receiverChatId,
  messageText,
  senderId,
  attachments,
}) => {
  let chat = await Chat.findOne({
    chatId: receiverChatId,
  });
  if (!chat.members.includes(`${senderId}`)) {
    return res.sendError({ message: "Invalid chat" });
  }

  let message = await Message.create({
    message: messageText,
    senderId,
    chatId: receiverChatId,
    attachments,
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
  return newMessage;
};

const createMessage = async (req, res) => {
  const io = req.app.get("io");
  try {
    const msg = await messageCreate({
      io,
      receiverChatId: req.body.receiverChatId,
      messageText: req.body.message,
      senderId: req.user._id,
      attachments: req.body.attachments,
    });
    return res.sendResponse({ data: msg });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const rawLimit = Number(req.query.limit || 50);
    const limit = Math.min(200, Math.max(1, rawLimit));
    const skip = (page - 1) * limit;

    let chat = await Chat.findOne({
      chatId: req.params.receiverChatId,
    })
      .populate({
        path: "members",
        select: {
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
        },
      })
      .populate({
        path: "messages",
        options: {
          sort: { createdAt: -1 },
          skip,
          limit,
        },
        populate: [
          {
            path: "senderId",
            select: {
              firstName: 1,
              lastName: 1,
              _id: 1,
              updatedAt: 1,
            },
          },
          {
            path: "offerId",
          },
        ],
      });

    return res.sendResponse({ data: chat?.messages ? chat.messages : [] });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getChats = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const rawLimit = Number(req.query.limit || 50);
    const limit = Math.min(200, Math.max(1, rawLimit));
    const skip = (page - 1) * limit;

    let chats = await Chat.find({ members: { $in: req.user._id } })
      .populate({
        path: "members",
        populate: {
          path: "profilePicture",
        },
        select: {
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
        },
      })
      .populate({
        path: "lastMessageId",
      })
      .populate({
        path: "postId",
      })
      .populate({
        path: "attachments",
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    return res.sendResponse({
      data: chats.reduce((acc, cv) => {
        acc.push({
          ...cv.toObject(),
          receiver: cv.members.find(
            (member) => `${member._id}` !== `${req.user._id}`
          ),
        });
        return acc;
      }, []),
    });
  } catch (error) {
    return res.sendError({ message: error.message });
  }
};

module.exports = {
  messageCreate,
  createChat,
  createMessage,
  getMessages,
  getChats,
};
