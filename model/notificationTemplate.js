const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const NotificationTemplateSchema = new Schema(
  {
    _id: {
      type: String,
      trim: true,
      unique: true,
    },
    module: {
      type: String,
      trim: true,
      required: false,
    },
    receiverType: {
      type: String,
      required: true,
      required: false,
    },
    description: {
      type: String,
      trim: true,
      required: false,
    },
    content: {
      type: String,
      trim: true,
      required: false,
    },
    subject: {
      type: String,
      required: true,
      required: false,
    },
    action: {
      type: String,
      trim: true,
      required: false,
    },
    redirectURL: {
      type: String,
      trim: true,
      required: false,
    },
    notificationType: {
      type: String,
      required: true,
      required: false,
    },
    subHeader: {
      type: String,
      trim: true,
      required: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { _id: false, timestamps: true }
);

module.exports = mongoose.model("NotificationTemplate", NotificationTemplateSchema);
