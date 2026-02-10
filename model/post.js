const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    postId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      text: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      text: true,
    },
    skills: [
      {
        type: Schema.Types.String,
        ref: "Skill",
      },
    ],
    price: {
      type: Number,
      default: 0,
    },
    location: {
      type: Number,
      required: false,
    },
    jobType: {
      type: String,
      required: true,
      trim: true,
    },
    experienceLevel: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
      trim: true,
    },
    endDate: {
      type: Date,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    transferId: {
      type: String,
      default: null,
    },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    postedBy: { type: Schema.Types.ObjectId, ref: "User" },
    acceptedProposal: { type: Schema.Types.ObjectId, ref: "Proposal" },
    proposals: [{ type: Schema.Types.ObjectId, ref: "Proposal" }],
  },
  { timestamps: true }
);

PostSchema.pre("save", async function (next) {
  try {
    const post = this;
    const prefix = "J";

    if (!post.postId) {
      const lastUser = await mongoose
        .model("Post")
        .findOne({})
        .sort({ createdAt: -1 })
        .exec();

      const newId = lastUser?.postId
        ? Number(lastUser.postId.split(prefix)[1]) + 1
        : 10001;
      post.postId = `${prefix}${newId}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Post", PostSchema);
