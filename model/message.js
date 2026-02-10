const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const MessageSchema = new Schema(
  {
    message: {
      type: String,
      required: [true, "Message must be provided"],
      trim: true,
    },
    chatId: { type: Schema.Types.String, ref: "Chat" },
    offerId: { type: Schema.Types.ObjectId, ref: "Offer" },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
