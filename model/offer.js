const mongoose = require("mongoose");
const { OFFER_STATUS } = require("../constants/modelConstants");

const Schema = mongoose.Schema;
const OfferSchema = new Schema(
  {
    bidAmount: {
      type: Number,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    payAmount: {
      type: Number,
      required: true,
      trim: true,
    },
    status: {
      type: Number,
      default: OFFER_STATUS.PENDING,
    },
    message: {
      type: String,
      required: false,
      trim: true,
    },
    chatId: { type: Schema.Types.ObjectId, ref: "Chat" },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    terms: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", OfferSchema);
