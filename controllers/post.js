const Post = require("../model/post");
const User = require("../model/user");
const Notification = require("../model/notification");
const Log = require("../model/log");

const createPost = async (req, res) => {
  const io = req.app.get("io");
  const {
    title,
    description,
    attachments,
    price,
    skills,
    location,
    jobType,
    startDate,
    endDate,
    experienceLevel,
  } = req.body;
  try {
    const createdPost = await Post.create({
      title,
      description,
      attachments,
      price,
      skills,
      location,
      jobType,
      startDate,
      endDate,
      experienceLevel,
      postedBy: req.user._id,
    });
    const users = await User.find({ "worker.skills": { $in: skills } });
    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { posts: createdPost._id } }
    );

    let post = await Post.findOne({ _id: createdPost._id })
      .populate({
        path: "attachments",
      })
      .populate({
        path: "proposals",
        populate: {
          path: "proposedBy",
          select: {
            firstName: 1,
            lastName: 1,
            _id: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      })
      .populate({
        path: "postedBy",
        select: {
          firstName: 1,
          lastName: 1,
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      });

    users.forEach((user) => {
      Notification.create({
        notification: "notification_1",
        user: user._id,
        values: {
          name: title,
          userName: req.user.firstName + " " + req.user.lastName,
        },
      });
      io.to(`${user._id}`).emit("RECEIVE_MESSAGE", {
        type: "NEW_NOTIFICTION",
        data: post,
      });
    });

    await User.updateOne({ _id: req.user._id }, { $inc: { totalJobs: 1 } });

    await Log.create({
      log: "log_6",
      user: req.user._id,
      values: {
        status: "success",
        postId: post.postId,
      },
    });
    return res.sendResponse({
      data: post,
      message: "Your job has been posted successfully",
    });
  } catch (err) {
    await Log.create({
      log: "log_6",
      user: req.user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({ message: err.message });
  }
};

const getPosts = async (req, res) => {
  try {
    let query = { isActive: true };

    if (req.query.jobType) {
      const jobTypes = Array.isArray(req.query.jobType)
        ? req.query.jobType
        : req.query.jobType.split(",");
      query.jobType = { $in: jobTypes };
    }

    if (req.query.experienceLevel) {
      const levels = Array.isArray(req.query.experienceLevel)
        ? req.query.experienceLevel
        : req.query.experienceLevel.split(",");
      query.experienceLevel = { $in: levels };
    }

    if (req.query.contractorId) {
      query.postedBy = req.query.contractorId;
    }

    const posts = await Post.find(query)
      .populate({
        path: "postedBy",
        populate: {
          path: "profilePicture",
        },
        select: {
          email: 1,
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      })
      .populate({
        path: "proposals",
        populate: {
          path: "proposedBy",
        },
        populate: {
          path: "chatId",
        },
      })
      .populate({
        path: "attachments",
      })
      .sort({ createdAt: -1 });
    return res.sendResponse({
      data: posts,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: req.user._id, isActive: true })
      .populate({
        path: "postedBy",
        populate: {
          path: "profilePicture",
        },
        select: {
          contractor: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      })
      .populate({
        path: "proposals",
        populate: {
          path: "proposedBy",
        },
        populate: {
          path: "chatId",
        },
      })
      .populate({
        path: "attachments",
      })
      .sort({ updatedAt: -1 });
    return res.sendResponse({
      data: posts,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getPostDetail = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId })
      .populate({
        path: "postedBy",
        populate: {
          path: "profilePicture",
        },
        select: {
          posts: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          location: 1,
          totalJobs: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      })
      .populate({
        path: "proposals",
        populate: {
          path: "proposedBy",
        },
        populate: {
          path: "chatId",
          select: {
            chatId: 1,
          },
        },
      })
      .populate({
        path: "proposals",
        populate: {
          path: "profilePicture",
        },
        populate: {
          path: "proposedBy",
          populate: {
            path: "profilePicture",
          },
          select: {
            firstName: 1,
            lastName: 1,
            email: 1,
            _id: 1,
            updatedAt: 1,
          },
        },
      })
      .populate({
        path: "attachments",
        // select: { _id: 1, updatedAt: 1 },
      })
      .populate({
        path: "skills",
      })
      .sort({ updatedAt: -1 });
    if (req.user) {
      await User.updateOne(
        { _id: req.user._id },
        {
          $push: { recently_visited: req.params.post_id },
        }
      );
    }
    return res.sendResponse({
      data: post,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const completePost = async (req, res) => {
  try {
    const _id = req.body.postId;
    await Post.updateOne({ _id: _id }, { isCompleted: true });
    const post = await Post.findOne({ _id: _id });

    await Log.create({
      log: "log_9",
      user: req.user._id,
      values: {
        status: "success",
        postId: post.postId,
      },
    });
    return res.sendResponse({ message: "Updated Succesfully!" });
  } catch (error) {
    await Log.create({
      log: "log_9",
      user: req.user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const _id = req.body.postId;
    await Post.updateOne({ _id: _id }, { isActive: false });
    const post = await Post.findOne({ _id: _id });

    await Log.create({
      log: "log_8",
      user: req.user._id,
      values: {
        status: "success",
        postId: post.postId,
      },
    });
    return res.sendResponse({ message: "Deleted Succesfully!" });
  } catch (error) {
    await Log.create({
      log: "log_8",
      user: req.user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({ message: error.message });
  }
};

const updatePost = async (req, res) => {
  const {
    title,
    description,
    attachments,
    price,
    skills,
    location,
    jobType,
    startDate,
    endDate,
    experienceLevel,
  } = req.body;

  try {
    const result = await Post.updateOne(
      { _id: req.params.postId },
      {
        title,
        description,
        attachments,
        price,
        skills,
        location,
        jobType,
        startDate,
        endDate,
        experienceLevel,
      }
    );
    const post = await Post.findOne({ _id: req.params.postId });

    await Log.create({
      log: "log_7",
      user: req.user._id,
      values: {
        status: "success",
        postId: post.postId,
      },
    });
    return res.sendResponse({ data: result });
  } catch (error) {
    await Log.create({
      log: "log_7",
      user: req.user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({ message: error.message });
  }
};
module.exports = {
  createPost,
  getPosts,
  getPostDetail,
  getMyPosts,
  deletePost,
  updatePost,
  completePost,
};
