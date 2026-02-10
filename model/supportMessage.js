const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const SupportMessageSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["chat", "email"], 
      required: true,
    },
    message: {
      type: String,
      required: [true, "Message must be provided"],
      trim: true,
    },
    supportId: { type: Schema.Types.ObjectId, ref: "Support" },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    senderId: {
      type: Schema.Types.ObjectId,
      refPath: "senderModel",
      required: true,
    },
    senderModel: { type: String, enum: ["User", "AdminUser"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportMessage", SupportMessageSchema);
