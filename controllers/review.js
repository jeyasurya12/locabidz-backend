const Review = require("../model/review");
const Post = require("../model/post");
const User = require("../model/user");
const Proposal = require("../model/proposal");
const Notification = require("../model/notification");
const Contract = require("../model/contract");

const createReview = async (req, res) => {
  const io = req.app.get("io");
  try {
    const review = await Review.create({
      user: req.body.userId,
      review: req.body.review,
      starCount: req.body.starCount < 0 ? 1 : req.body.starCount,
      reviewedBy: req.user._id,
      post: req.body.postId,
    });
    const allReviews = await Review.find({
      user: req.body.userId,
    });
    const voteCount = allReviews.length;
    const voteAverage = voteCount
      ? allReviews.reduce((acc, cv) => acc + cv.starCount, 0) / voteCount
      : 0;
    await User.updateOne(
      { _id: req.body.userId },
      {
        $addToSet: { reviews: review._id },
        voteAverage,
        voteCount,
      }
    );
    await Contract.updateOne(
      { _id: req.body.contractId },
      {
        $addToSet: { reviews: review._id },
      }
    );
    await Notification.create({
      notification: "notification_9",
      user: req.body.userId,
      values: {
        name: req.user.firstName + " " + req.user.lastName,
        userName: req.user.firstName + " " + req.user.lastName,
      },
    });
    io.to(`${req.body.userId}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_NOTIFICTION",
      data: review,
    });
    return res.sendResponse({
      message: "Your review has been submitted succesfully",
      data: review,
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
