const { MILESTONE_STATUS } = require("../constants/modelConstants");
const { stripeCreateCharge, stripeTransfer } = require("../lib/libStripe");
const Contract = require("../model/contract");
const Fee = require("../model/fee");
const Milestone = require("../model/milestone");
const Notification = require("../model/notification");
const User = require("../model/user");

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      isActive: true,
      user: { $in: [req.user._id] },
    })
      .populate({
        path: "notification",
      })
      .sort({ createdAt: -1 });
    return res.sendResponse({
      data: notifications,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const updateNotification = async (req, res) => {
  const { _id } = req.params;
  try {
    const msg = await Notification.findOne({ _id: _id });

    const result = await Notification.updateMany(
      { _id: _id },
      { isRead: true }
    );

    return res.sendResponse({ data: result });
  } catch (error) {
    return res.sendError({ message: error.message });
  }
};

const clearNotification = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.sendResponse();
  } catch (error) {
    return res.sendError({ message: error.message });
  }
};
module.exports = {
  getNotifications,
  clearNotification,
  updateNotification,
};
