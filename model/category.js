const mongoose = require("mongoose");

// schema with validation
const Schema = mongoose.Schema;

const CategorySchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    sub1: [
      {
        _id: {
          type: String,
          required: true,
          trim: true,
          unique: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          default: null,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    role: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, _id: false }
);

module.exports = mongoose.model("Category", CategorySchema);
