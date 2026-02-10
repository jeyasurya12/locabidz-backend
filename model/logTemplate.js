const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const LogTemplateSchema = new Schema(
  {
    _id: {
      type: String,
      trim: true,
      unique: true,
    },
    module: {
      type: String,
      trim: true,
      required: false,
    },
    content: {
      type: String,
      trim: true,
      required: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { _id: false, timestamps: true }
);

module.exports = mongoose.model("LogTemplate", LogTemplateSchema);
