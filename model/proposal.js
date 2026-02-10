const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ProposalSchema = new Schema(
  {
    proposalId: {
      type: String,
      unique: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      trim: true,
    },
    deliveredIn: {
      type: Date,
      required: true,
      trim: true,
    },
    proposalText: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      required: false,
    },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    proposedBy: { type: Schema.Types.ObjectId, ref: "User" },
    chatId: { type: Schema.Types.ObjectId, ref: "Chat" },
  },
  { timestamps: true }
);

ProposalSchema.pre("save", async function (next) {
  try {
    const proposal = this;
    const prefix = "P";

    if (!proposal.proposalId) {
      const lastUser = await mongoose
        .model("Proposal")
        .findOne({})
        .sort({ createdAt: -1 })
        .exec();

      const newId = lastUser?.proposalId
        ? Number(lastUser.proposalId.split(prefix)[1]) + 1
        : 10001;
      proposal.proposalId = `${prefix}${newId}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Proposal", ProposalSchema);
