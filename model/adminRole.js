const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const AdminRoleSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    privilege: { type: Schema.Types.String, ref: "Privilege" },
  },
  { timestamps: true, _id: false }
);

module.exports = mongoose.model("AdminRole", AdminRoleSchema);
