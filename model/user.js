const mongoose = require("mongoose");
const { USER_STATUS } = require("../constants/modelConstants");

const Schema = mongoose.Schema;
const UsersSchema = new Schema(
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
    countryCode: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
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
      select: false,
    },
    role: {
      type: String,
      required: false,
      trim: true,
    },
    location: {
      street: {
        type: String,
        required: false,
        trim: true,
      },
      city: {
        type: String,
        required: false,
        trim: true,
      },
      state: {
        type: String,
        required: false,
        trim: true,
      },
      country: {
        type: String,
        required: false,
        trim: true,
      },
      postalCode: {
        type: Number,
        required: false,
        trim: true,
      },
    },
    worker: {
      title: {
        type: String,
        required: false,
        trim: true,
      },
      summary: {
        type: String,
        required: false,
      },
      skills: [
        {
          type: String,
          ref: "Skill",
        },
      ],
      tools: [
        {
          type: String,
          ref: "Tool",
        },
      ],
      certificates: [
        {
          title: {
            type: String,
            required: false,
          },
          attachments: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Attachment" },
          ],
        },
      ],
      experience: [
        {
          title: {
            type: String,
            required: false,
          },
          company: {
            type: String,
            required: false,
          },
          location: {
            type: String,
            required: false,
          },
          startDate: {
            type: String,
            required: false,
          },
          endDate: {
            type: String,
            required: false,
          },
          bio: {
            type: String,
            required: false,
          },
          attachments: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Attachment" },
          ],
        },
      ],
      portfolio: [
        {
          title: {
            type: String,
            required: false,
          },
          description: {
            type: String,
            required: false,
          },
          attachments: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Attachment" },
          ],
        },
      ],
      hourlyRate: {
        type: Number,
        required: false,
        default: 0,
      },
      transportation: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    contractor: {
      tradeName: {
        type: String,
        required: false,
        trim: true,
      },
      description: {
        type: String,
        required: false,
      },
      tradeType: {
        type: String,
        required: false,
        trim: true,
      },
      documents: [
        {
          title: {
            type: String,
            required: false,
          },
          attachments: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Attachment" },
          ],
        },
      ],
    },
    bankAccount: {
      accountNumber: {
        type: String,
        required: false,
      },
      routingNumber: {
        type: String,
        required: false,
      },
      currency: {
        type: String,
        required: false,
      },
      country: {
        type: String,
        required: false,
      },
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    accessToken: {
      type: String,
      default: null,
      select: false,
    },
    accessTokenCreatedAt: {
      type: Date,
      default: null,
      select: false,
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
      select: false,
    },
    forgotPasswordTokenCreatedAt: {
      type: Date,
      default: null,
      select: false,
    },
    status: {
      type: String,
      default: USER_STATUS.PENDING,
    },
    message: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isUpdated: {
      type: Boolean,
      default: false,
    },
    account: {
      type: String,
      default: null,
    },
    activeJobs: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    totalJobs: {
      type: Number,
      default: 0,
    },
    voteAverage: {
      type: Number,
      default: 0,
    },
    voteCount: {
      type: Number,
      default: 0,
    },
    profilePicture: { type: Schema.Types.ObjectId, ref: "Attachment" },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  },
  { timestamps: true }
);

UsersSchema.pre("save", async function (next) {
  try {
    const user = this;
    const prefix = "U";

    // Generate a unique userId
    if (!user.userId) {
      const lastUser = await mongoose
        .model("User")
        .findOne({})
        .sort({ createdAt: -1 })
        .exec();

      const newId = lastUser?.userId
        ? Number(lastUser.userId.split(prefix)[1]) + 1
        : 10001;
      user.userId = `${prefix}${newId}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("User", UsersSchema);
