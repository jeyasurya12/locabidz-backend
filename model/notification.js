const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    receiver: {
      name: {
        type: String,
        trim: true,
        required: false,
      }
    },
    Subject: {
      type: String,
      trim: true,
      required: false,
    },
    msgContent: {
      type: String,
      trim: true,
      required: false,
    },
    redirectURL: {
      type: String,
      trim: true,
      required: false,
    },
    values: {
      name: {
        type: String,
        trim: true,
        required: false,
      },
      userName: {
        type: String,
        trim: true,
        required: false,
      },
      orderId: {
        type: String,
        trim: true,
        required: false,
      },
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    notification: { type: String, ref: "NotificationTemplate" },
    user: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, isActive: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
