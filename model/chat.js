const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ChatSchema = new Schema(
  {
    chatId: {
      type: String,
      required: true,
      trim: true,
    },
    lastMessageId: { type: Schema.Types.ObjectId, ref: "Message" },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal" },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
  },
  { timestamps: true }
);

ChatSchema.index({ chatId: 1 }, { unique: true });
ChatSchema.index({ members: 1, updatedAt: -1 });

module.exports = mongoose.model("Chat", ChatSchema);
