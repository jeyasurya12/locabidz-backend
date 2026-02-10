const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const StaffSchema = new Schema(
    {
        staffId: {
            type: String,
            trim: true,
            required: false,
        },
        firstName: {
            type: String,
            trim: true,
            required: true,
        },
        lastName: {
            type: String,
            trim: true,
            required: true,
        },
        email: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
      },
      { timestamps: true }
);
StaffSchema.pre("save", async function (next) {
    try {
        const staff = this;
        const prefix = "ST";

        if (!staff.staffId) {
            const lastStaff = await mongoose
                .model("Staff")
                .findOne({})
                .sort({ createdAt: -1 })
                .exec();

            const newId = lastStaff?.staffId
                ? Number(lastStaff.staffId.split(prefix)[1]) + 1
                : 10001;

            staff.staffId = `${prefix}${newId}`;
        }
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("Staff", StaffSchema);
