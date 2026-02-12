const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const StripeEventSchema = new Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    livemode: {
      type: Boolean,
      required: false,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StripeEvent", StripeEventSchema);
