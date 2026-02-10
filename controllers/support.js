const {
  MILESTONE_STATUS,
  TRANSACTION_METHODS,
} = require("../constants/modelConstants");
const sendMail = require("../helpers/sendMail");
const { stripeCreateCharge, stripeTransfer } = require("../lib/libStripe");
const AdminUser = require("../model/adminUser");
const Category = require("../model/category");
const Contract = require("../model/contract");
const Fee = require("../model/fee");
const Milestone = require("../model/milestone");
const Support = require("../model/support");
const SupportMessage = require("../model/supportMessage");
const User = require("../model/user");
const Setting = require("../model/setting");


const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      role: req.user.role,
    }).sort({ _id: 1 });
    return res.sendResponse({ data: categories });
  } catch (err) {
    return res.sendError({ success: false, message: err.message });
  }
};

const getSupports = async (req, res) => {
  try {
    const supports = await Support.find({
      isActive: true,
      user: req.user._id,
    })
      .populate({
        path: "lastMessageId",
      })
      .sort({ createdAt: -1 });
    return res.sendResponse({
      data: supports,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getSupportMessages = async (req, res) => {
  try {
    const support = await Support.findOne({ _id: req.params.supportId })
      .populate({
        path: "user",
        select: {
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
        },
      })
      .populate({
        path: "agent",
        select: {
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
        },
      })
      .populate({
        path: "messages",
        populate: {
          path: "senderId",
          select: {
            firstName: 1,
            lastName: 1,
            _id: 1,
            updatedAt: 1,
          },
        },
      });
    return res.sendResponse({
      data: support,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

// const createSupport = async (req, res) => {
//   try {
//     const support = await Support.create({
//       category: req.body.category,
//       subCategory: req.body.subCategory,
//       title: req.body.title,
//       description: req.body.description,
//       user: req.user._id,
//       agent: "67bec9e80e912f3d5e1e0043", 
//     });
//     const emailData = {
//       to: req.user.email,
//       subject: "Locabidz Support Management",
//       text: `Your ticket number is ${support.supportId}.`,
//       html: `
//         <div class="email-container" style="font-family: Arial, sans-serif; color: #333;">
//           <div class="logo" style="text-align: center;">
//             <h1 style="color: #007bff;">Locabidz</h1>
//           </div>
//           <p>Dear ${req.user.firstName} ${req.user.lastName},</p><br><br>
//           <p>We have received your support request and are currently reviewing it.</p><br>
//           <p>Your ticket number is <strong>${support.supportId}</strong>.</p><br>
//           <p>Our support team will get back to you as soon as possible. If you have any additional details to share, please reply to this email.</p><br>
//           <p>Thank you for reaching out to us. We appreciate your patience and cooperation.</p><br><br><br>
//         </div>
//       `,
//     };

//     sendMail(emailData);
//     return res.sendResponse({ data: support });
//   } catch (error) {
//     return res.sendError({ message: error.message });
//   }
// };
// const createSupport = async (req, res) => {
//   try {
//     const agents = await AdminUser.find({ role: "agent", isAvailable: true }).sort({ createdAt: 1 });
//     if (agents.length === 0) {
//       return res.status(400).json({ success: false, message: "No available agents" });
//     }
//     let setting = await Setting.findOne({ key: "lastAssignedAgentIndex" });
//     let currentIndex = setting ? setting.value : 0;
//     const assignedAgent = agents[currentIndex];
//     const nextIndex = (currentIndex + 1) % agents.length;
//     await Setting.updateOne(
//       { key: "lastAssignedAgentIndex" },
//       { value: nextIndex },
//       { upsert: true } 
//     );
//     const support = await Support.create({
//       category: req.body.category,
//       subCategory: req.body.subCategory,
//       title: req.body.title,
//       description: req.body.description,
//       user: req.user._id,
//       agent: assignedAgent._id, 
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Support ticket created successfully",
//       data: support,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };
// const createSupport = async (req, res) => {
//   try {
//     const io = req.app.get("io");

//     if (!io) {
//       return res.status(500).json({
//         success: false,
//         message: "Socket.io instance not found",
//       });
//     }
//     const { category, subCategory, title, description } = req.body;
//     const agents = await AdminUser.find({
//       role: "agent",
//       isAvailable: true,
//       category: category,
//     }).sort({ createdAt: 1 });

//     if (agents.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No available agents for this category",
//       });
//     }
//     let setting = await Setting.findOne({ key: "lastAssignedAgentIndex" });
//     let currentIndex = setting ? setting.value : 0;
//     currentIndex = currentIndex % agents.length;
//     const assignedAgent = agents[currentIndex];
//     const nextIndex = (currentIndex + 1) % agents.length;

//     await Setting.updateOne(
//       { key: "lastAssignedAgentIndex" },
//       { value: nextIndex },
//       { upsert: true }
//     );
//     const support = await Support.create({
//       category,
//       subCategory,
//       title,
//       description,
//       user: req.user._id,
//       agent: assignedAgent._id,
//     });
//     await AdminUser.findByIdAndUpdate(
//       assignedAgent._id,
//       { $push: { assignedTickets: support._id } },
//       { new: true }
//     );
//     io.to(assignedAgent._id.toString()).emit("NEW_TICKET_ASSIGNED", {
//       message: "You have been assigned a new support ticket.",
//       supportTicket: support,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Support ticket created and assigned successfully",
//       data: support,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };
const createSupport = async (req, res) => {
  try {
    const io = req.app.get("io");

    if (!io) {
      return res.status(500).json({
        success: false,
        message: "Socket.io instance not found",
      });
    }
    const { category, subCategory, title, description } = req.body;
    const agents = await AdminUser.find({
      role: "agent",
      isAvailable: true,
      category: category,
    }).sort({ createdAt: 1 });

    let assignedAgent = null;

    if (agents.length > 0) {
      let setting = await Setting.findOne({ key: "lastAssignedAgentIndex" });
      let currentIndex = setting ? setting.value : 0;
      currentIndex = currentIndex % agents.length;
      assignedAgent = agents[currentIndex];
      const nextIndex = (currentIndex + 1) % agents.length;

      await Setting.updateOne(
        { key: "lastAssignedAgentIndex" },
        { value: nextIndex },
        { upsert: true }
      );
    }
    const support = await Support.create({
      category,
      subCategory,
      title,
      description,
      user: req.user._id,
      agent: assignedAgent ? assignedAgent._id : null,
      status: assignedAgent ? 2 : 1,
    });

    if (assignedAgent) {
      await AdminUser.findByIdAndUpdate(
        assignedAgent._id,
        { $push: { assignedTickets: support._id } },
        { new: true }
      );
      io.to(assignedAgent._id.toString()).emit("NEW_TICKET_ASSIGNED", {
        message: "You have been assigned a new support ticket.",
        supportTicket: support,
      });
      sendMail({
        to: assignedAgent.email,
        subject: "New Support Ticket Assigned",
        html: `
         <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #007bff;">New Ticket Assigned</h2>
          <p>Dear ${assignedAgent.firstName} ${assignedAgent.lastName},</p>
          <p>A new support ticket has been assigned to you.</p>
          <p><strong>Ticket ID:</strong> ${support.supportId}</p>
          <p>Title: ${support.title}</p>
          <p>Description: ${support.description}</p>
          <p>Please check your dashboard to respond to the user as soon as possible.</p>
              <br>
              <p>Best Regards,</p>
              <p>Locabidz Support Team</p>
           </div>
        `,
      });
    }
    const emailData = {
      to: req.user.email,
      subject: "Locabidz Support Management",
      text: `Your ticket number is ${support.supportId}.`,
      html: `
        <div class="email-container" style="font-family: Arial, sans-serif; color: #333;">
          <div class="logo" style="text-align: center;">
            <h1 style="color: #007bff;">Locabidz</h1>
          </div>
          <p>Dear ${req.user.firstName} ${req.user.lastName},</p><br><br>
          <p>We have received your support request and are currently reviewing it.</p><br>
          <p>Your ticket number is <strong>${support.supportId}</strong>.</p><br>
          <p>Our support team will get back to you as soon as possible. If you have any additional details to share, please reply to this email.</p><br>
          <p>Thank you for reaching out to us. We appreciate your patience and cooperation.</p><br><br><br>
        </div>
      `,
    };

    sendMail(emailData);
    return res.status(201).json({
      success: true,
      message: assignedAgent
        ? "Support ticket created and assigned successfully"
        : "Support ticket created. Waiting for an available agent.",
      data: support,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createMessage = async (req, res) => {
  const io = req.app.get("io");
  try {
    const { supportId, message, attachments } = req.body;

    let support = await Support.findOne({ _id: supportId });

    let msg = await SupportMessage.create({
      message,
      supportId,
      attachments,
      senderId: req.user._id,
      senderModel: "User",
    });

    await support.updateOne({
      $addToSet: { messages: msg._id },
      $set: { lastMessageId: msg._id },
    });

    let newMessage = await SupportMessage.findOne({ _id: msg._id })
      .populate("attachments")
      .populate({
        path: "senderId",
        select: "firstName lastName userId _id updatedAt",
      });

    io.to(`${support.user}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_SUPPORT_MESSAGE",
      data: newMessage,
    });
    io.to(`${support.agent}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_SUPPORT_MESSAGE",
      data: newMessage,
    });
    const adminUsers = await AdminUser.find({ role: "admin" });
    adminUsers.forEach((member) => {
      io.to(`${member._id}`).emit("RECEIVE_MESSAGE", {
        type: "NEW_SUPPORT_MESSAGE",
        data: newMessage,
      });
    });

    return res.sendResponse({ data: newMessage });
  } catch (err) {
    console.error("Error in createMessage:", err);
    return res.sendError({ message: err.message });
  }
};

const updateSupport = async (req, res) => {
  const { _id } = req.params;
  try {
    const result = await Support.updateMany({ _id: _id }, { ...req.body });

    return res.sendResponse({ data: result });
  } catch (error) {
    return res.sendError({ message: error.message });
  }
};

module.exports = {
  getSupports,
  updateSupport,
  createSupport,
  getSupportMessages,
  getCategories,
  createMessage,
};
