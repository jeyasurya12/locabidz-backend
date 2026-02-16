const Review = require("../model/review");
const Post = require("../model/post");
const User = require("../model/user");
const Proposal = require("../model/proposal");
const Notification = require("../model/notification");
const Contract = require("../model/contract");

const mongoose = require("mongoose");

const createReview = async (req, res) => {
  const io = req.app.get("io");
  try {
    const session = await mongoose.startSession();

    let review;
    let voteAverage = 0;
    let voteCount = 0;

    await session.withTransaction(async () => {
      review = await Review.create(
        [
          {
            user: req.body.userId,
            review: req.body.review,
            starCount: req.body.starCount,
            reviewedBy: req.user._id,
            post: req.body.postId,
          },
        ],
        { session }
      );

      const ratingAgg = await Review.aggregate([
        { $match: { user: mongoose.Types.ObjectId(req.body.userId) } },
        {
          $group: {
            _id: "$user",
            voteAverage: { $avg: "$starCount" },
            voteCount: { $sum: 1 },
          },
        },
      ]).session(session);

      voteAverage = ratingAgg?.[0]?.voteAverage || 0;
      voteCount = ratingAgg?.[0]?.voteCount || 0;

      await User.updateOne(
        { _id: req.body.userId },
        {
          $addToSet: { reviews: review[0]._id },
          voteAverage,
          voteCount,
        },
        { session }
      );

      await Contract.updateOne(
        { _id: req.body.contractId },
        {
          $addToSet: { reviews: review[0]._id },
        },
        { session }
      );

      await Notification.create(
        [
          {
            notification: "notification_9",
            user: req.body.userId,
            values: {
              name: req.user.firstName + " " + req.user.lastName,
              userName: req.user.firstName + " " + req.user.lastName,
            },
          },
        ],
        { session }
      );
    });

    session.endSession();

    io.to(`${req.body.userId}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_NOTIFICTION",
      data: review?.[0] || null,
    });

    return res.sendResponse({
      message: "Your review has been submitted succesfully",
      data: {
        review: review?.[0] || null,
        voteAverage,
        voteCount,
      },
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.params.userId })
      .populate({
        path: "reviewedBy",
        select: {
          firstName: 1,
          lastName: 1,
          email: 1,
          _id: 1,
          updatedAt: 1,
        },
      })
      .populate({
        path: "user",
        select: {
          firstName: 1,
          lastName: 1,
          email: 1,
          _id: 1,
          updatedAt: 1,
        },
      })
      .populate({
        path: "post",
      })
      .sort({ updatedAt: -1 });
    return res.sendResponse({
      data: reviews,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

module.exports = { createReview, getReviews };
