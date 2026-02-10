const mongoose = require("mongoose");

const connectDB = async (url) => {
  mongoose.set("strictQuery", false);
  const resolvedUrl =
    url && typeof url === "string" && url.trim().length > 0
      ? url.trim()
      : "mongodb://localhost:27017/contractors";

  if (!url || typeof url !== "string" || url.trim().length === 0) {
    console.warn(
      "MONGO_URI is missing. Falling back to mongodb://localhost:27017/contractors. Set MONGO_URI in your .env for production or custom environments."
    );
  }

  return mongoose.connect(resolvedUrl);
};

module.exports = connectDB;
