const mongoose = require("mongoose");
const {
  SUPPORT_STATUS,
  SUPPORT_PRIORITY,
} = require("../constants/modelConstants");

const Schema = mongoose.Schema;

const SupportSchema = new Schema(
  {
    supportId: {
      type: String,
      trim: true,
      required: false,
    },
    status: {
      type: Number,
      required: true,
      default: SUPPORT_STATUS.OPEN,
    },
    // status: {
    //   type: Number,
    //   required: false, 
    //   default: null, 
    // },
    priority: {
      type: Number,
      required: false,
      default: SUPPORT_PRIORITY.LOW,
    },
    type: {
      type: Number,
      required: false,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      required: true,
    },
    subCategory: {
      type: String,
      trim: true,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: false,
    },
    description: {
      type: String,
      trim: true,
      required: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    agent: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    lastMessageId: { type: Schema.Types.ObjectId, ref: "SupportMessage" },
    messages: [{ type: Schema.Types.ObjectId, ref: "SupportMessage" }],
  },
  { timestamps: true }
);

SupportSchema.pre("save", async function (next) {
  try {
    const support = this;
    const prefix = "S";

    if (!support.supportId) {
      const lastUser = await mongoose
        .model("Support")
        .findOne({})
        .sort({ createdAt: -1 })
        .exec();

      const newId = lastUser?.supportId
        ? Number(lastUser.supportId.split(prefix)[1]) + 1
        : 10001;
      support.supportId = `${prefix}${newId}`;
    }
    // if (!support.status) {
    //   support.status = support.agent ? SUPPORT_STATUS.OPEN : SUPPORT_STATUS.QUEUE;
    // }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Support", SupportSchema);
