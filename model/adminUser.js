const mongoose = require("mongoose");
const { USER_STATUS } = require("../constants/modelConstants");

const Schema = mongoose.Schema;
const AdminUsersSchema = new Schema(
  {
    userId: {
      type: String,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email must be provided"],
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      required: true,
    },
    role: { type: Schema.Types.String, ref: "AdminRole" },
    assignedTickets: [
      {
        type: Schema.Types.ObjectId,
        ref: "Support", 
      },
    ],
    accessToken: {
      type: String,
      default: null,
    },
    accessTokenCreatedAt: {
      type: Date,
      default: null,
    },
    verifyToken: {
      type: String,
      default: null,
    },
    verifyTokenCreatedAt: {
      type: Date,
      default: null,
    },
    forgotPasswordToken: {
      type: String,
      default: null,
    },
    forgotPasswordTokenCreatedAt: {
      type: Date,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true, 
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profilePicture: { type: Schema.Types.ObjectId, ref: "Attachment" },
  },
  { timestamps: true }
);

AdminUsersSchema.index({ role: 1, isAvailable: 1 });

AdminUsersSchema.pre("save", async function (next) {
  try {
    const user = this;
    const prefix = "A";

    // Generate a unique userId
    if (!user.userId) {
      const lastAdminUser = await mongoose
        .model("AdminUser")
        .findOne({})
        .sort({ createdAt: -1 })
        .exec();

      const newId = lastAdminUser?.userId
        ? Number(lastAdminUser.userId.split(prefix)[1]) + 1
        : 10001;
      user.userId = `${prefix}${newId}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("AdminUser", AdminUsersSchema);
