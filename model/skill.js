const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SkillSchema = new Schema(
    {
        _id: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        name: {
            type: String,
            default: null,
        },
    },
    { timestamps: true, _id: false }
);

module.exports = mongoose.model("Skill", SkillSchema);
