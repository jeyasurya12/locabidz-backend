const mongoose = require("mongoose");

// schema with validation
const Schema = mongoose.Schema;

const PrivilegeSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    create: {
      type: Boolean,
      default: false,
    },
    delete: {
      type: Boolean,
      default: false,
    },
    share: {
      type: Boolean,
      default: false,
    },
    edit: {
      type: Boolean,
      default: false,
    },
    view: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false, timestamps: true }
);

module.exports = mongoose.model("Privilege", PrivilegeSchema);
