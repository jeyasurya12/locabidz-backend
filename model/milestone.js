const mongoose = require("mongoose");
const { MILESTONE_STATUS } = require("../constants/modelConstants");

const Schema = mongoose.Schema;
const MilestoneSchema = new Schema(
  {
    milestoneId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: Number,
      default: MILESTONE_STATUS.PENDING,
    },
    contractId: { type: Schema.Types.ObjectId, ref: "Contract" },
    contractorId: {
      type: String,
      required: true,
      trim: true,
    },
    workerId: {
      type: String,
      required: true,
      trim: true,
    },
    paymentId: {
      type: String,
      required: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

MilestoneSchema.pre("save", async function (next) {
  try {
    const milestone = this;
    const prefix = "M";

    if (!milestone.milestoneId) {
      const lastUser = await mongoose
        .model("Milestone")
        .findOne({})
        .sort({ createdAt: -1 })
        .exec();

      const newId = lastUser?.milestoneId
        ? Number(lastUser.milestoneId.split(prefix)[1]) + 1
        : 10001;
      milestone.milestoneId = `${prefix}${newId}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Milestone", MilestoneSchema);
