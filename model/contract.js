const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ContractSchema = new Schema(
  {
    contractId: {
      type: String,
      unique: true,
    },
    offerId: { type: Schema.Types.ObjectId, ref: "Offer" },
    chatId: { type: Schema.Types.ObjectId, ref: "Chat" },
    milestones: [{ type: Schema.Types.ObjectId, ref: "Milestone" }],
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

ContractSchema.pre("save", async function (next) {
  try {
    const contract = this;
    const prefix = "C";

    if (!contract.contractId) {
      const lastUser = await mongoose
        .model("Contract")
        .findOne({})
        .sort({ createdAt: -1 })
        .exec();

      const newId = lastUser?.contractId
        ? Number(lastUser.contractId.split(prefix)[1]) + 1
        : 10001;
      contract.contractId = `${prefix}${newId}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Contract", ContractSchema);
