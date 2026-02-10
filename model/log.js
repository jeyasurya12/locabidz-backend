const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const LogSchema = new Schema(
  {
    logId: {
      type: String,
      trim: true,
      required: false,
    },
    values: {
      status: {
        type: String,
        trim: true,
        required: false,
      },
      postId: {
        type: String,
        trim: true,
        required: false,
      },
      proposalId: {
        type: String,
        trim: true,
        required: false,
      },
      milestoneId: {
        type: String,
        trim: true,
        required: false,
      },
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    log: { type: String, ref: "LogTemplate" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

LogSchema.pre("save", async function (next) {
  try {
    const log = this;
    const prefix = "L";

    if (!log.logId) {
      const lastUser = await mongoose
        .model("Log")
        .findOne({})
        .sort({ createdAt: -1 })
        .exec();

      const newId = lastUser?.logId
        ? Number(lastUser.logId.split(prefix)[1]) + 1
        : 10001;
      log.logId = `${prefix}${newId}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Log", LogSchema);
