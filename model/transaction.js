const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const TransactionSchema = new Schema(
  {
    transactionId: {
      type: String,
      trim: true,
      required: false,
    },
    amount: {
      type: Number,
      required: true,
      trim: true,
    },
    feeAmount: {
      type: Number,
      required: false,
      default: 0,
    },
    method: {
      type: Number,
      required: true,
      trim: true,
    },
    paymentId: {
      type: String,
      trim: true,
      required: false,
    },
    status: {
      type: String,
      required: false,
      trim: true,
      default: "pending",
    },
    stripeObjectType: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    user: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

TransactionSchema.index({ paymentId: 1 });
TransactionSchema.index({ user: 1, createdAt: -1 });

TransactionSchema.pre("save", async function (next) {
  try {
    const transaction = this;
    const prefix = "T";

    if (!transaction.transactionId) {
      const lastUser = await mongoose
        .model("Transaction")
        .findOne({})
        .sort({ createdAt: -1 })
        .exec();

      const newId = lastUser?.transactionId
        ? Number(lastUser.transactionId.split(prefix)[1]) + 1
        : 10001;
      transaction.transactionId = `${prefix}${newId}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Transaction", TransactionSchema);
