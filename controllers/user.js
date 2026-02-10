const { updateConnectAccount } = require("../lib/libStripe");
const Log = require("../model/log");
const User = require("../model/user");

const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId })
      .populate({
        path: "profilePicture",
      })
      .populate({
        path: "worker.skills",
      })
      .populate({
        path: "worker.tools",
      })
      .populate({
        path: "worker.certificates.attachments",
      })
      .populate({
        path: "worker.experience.attachments",
      })
      .populate({
        path: "worker.portfolio.attachments",
      })
      .populate({
        path: "contractor.documents.attachments",
      });
    if (!user) {
      return res.sendError({
        success: false,
        message: "User not found!",
        statuscode: 404,
      });
    }
    return res.sendResponse({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        worker: user.worker,
        contractor: user.contractor,
        voteAverage: user.voteAverage,
        voteCount: user.voteCount,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    return res.sendError({ success: false, message: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id })
      .populate({
        path: "profilePicture",
      })
      .populate({
        path: "worker.skills",
      })
      .populate({
        path: "worker.tools",
      })
      .populate({
        path: "worker.certificates.attachments",
      })
      .populate({
        path: "worker.experience.attachments",
      })
      .populate({
        path: "worker.portfolio.attachments",
      })
      .populate({
        path: "contractor.documents.attachments",
      });
    if (!user) {
      return res.sendError({
        success: false,
        message: "User not found!",
        statuscode: 404,
      });
    }
    return res.sendResponse({
      success: true,
      data: {
        _id: user._id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        isUpdated: user.isUpdated,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        worker: user.worker,
        contractor: user.contractor,
        bankAccount: user.bankAccount,
        location: user.location,
        totalEarnings: user.totalEarnings,
        voteAverage: user.voteAverage,
        voteCount: user.voteCount,
        activeJobs: user.activeJobs,
        completedJobs: user.completedJobs,
        totalJobs: user.totalJobs,
      },
    });
  } catch (err) {
    return res.sendError({ success: false, message: err.message });
  }
};

const workerProfile = async (req, res) => {
  try {
    const user = await User.updateOne(
      { _id: req.user._id },
      { ...req.body, isUpdated: true }
    );

    await Log.create({
      log: "log_4",
      user: req.user._id,
      values: {
        status: "success",
      },
    });
    const updateUser = await User.findOne({ _id: req.user._id });
    // await updateConnectAccount({ user: updateUser });
    return res.sendResponse({
      data: user,
      message: "Profile updated successfully.",
    });
  } catch (err) {
    await Log.create({
      log: "log_4",
      user: req.user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({ message: err.message });
  }
};

const contractorProfile = async (req, res) => {
  try {
    const userExits = await User.findOne({
      _id: { $ne: req.user._id },
      role: "contractor",
      "contractor.tradeName": req.body.contractor.tradeName,
    });
    if (userExits) {
      return res.sendError({ message: "Tradename already exits." });
    }
    const user = await User.updateOne(
      { _id: req.user._id },
      { ...req.body, isUpdated: true }
    );
    await Log.create({
      log: "log_4",
      user: req.user._id,
      values: {
        status: "success",
      },
    });
    const updateUser = await User.findOne({ _id: req.user._id });
    // await updateConnectAccount({ user: updateUser });
    return res.sendResponse({
      data: user,
      message: "Profile updated successfully.",
    });
  } catch (err) {
    await Log.create({
      log: "log_4",
      user: req.user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({ message: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const user = await User.updateOne({ _id: req.user._id }, { ...req.body });
    await Log.create({
      log: "log_5",
      user: req.user._id,
      values: {
        status: "success",
      },
    });
    return res.sendResponse({
      data: user,
      message: "Profile role updated successfully.",
    });
  } catch (err) {
    await Log.create({
      log: "log_5",
      user: req.user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({ message: err.message });
  }
};

const getContractors = async (req, res) => {
  try {
    const contractors = await User.find({
      role: "contractor",
      isActive: true,
      isUpdated: true,
    });
    return res.sendResponse({
      data: contractors.map((contractor) => ({
        _id: contractor._id,
        firstName: contractor.firstName,
        lastName: contractor.lastName,
        email: contractor.email,
        phoneNumber: contractor.phoneNumber,
        contractor: contractor.contractor,
        bankAccount: contractor.bankAccount,
        location: contractor.location,
        voteAverage: contractor.voteAverage,
        voteCount: contractor.voteCount,
      })),
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getWorkers = async (req, res) => {
  try {
    let query = { isActive: true, isUpdated: true, role: "worker" };

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i"); // Case-insensitive regex
      query.$or = [
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
      ];
    }

    if (req.query.rating) {
      query.voteAverage = { $gte: Number(req.query.rating) };
    }

    const workers = await User.find(query);
    return res.sendResponse({
      data: workers.map((worker) => ({
        _id: worker._id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        email: worker.email,
        phoneNumber: worker.phoneNumber,
        worker: worker.worker,
        bankAccount: worker.bankAccount,
        location: worker.location,
        voteAverage: worker.voteAverage,
        voteCount: worker.voteCount,
      })),
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

module.exports = {
  getPublicProfile,
  getProfile,
  workerProfile,
  contractorProfile,
  updateUserRole,
  getContractors,
  getWorkers,
};
