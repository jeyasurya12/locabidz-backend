const mongoose = require("mongoose");
const { jwtSign } = require("../helpers/JWT");
const User = require("../model/user");
const Post = require("../model/post");
const Contract = require("../model/contract");
const Milestone = require("../model/milestone");
const Transaction = require("../model/transaction");
const moment = require("moment");
const bcrypt = require("bcrypt");
const { getColumns } = require("../helpers/handlers");
const getModals = require("../model/index");
const { USER_STATUS } = require("../constants/modelConstants");
const NotificationTemplate = require("../model/notificationTemplate");
const sendMail = require("../helpers/sendMail");
const sendOnboardMail = require("../helpers/sendOnboardMail");
const { EMAIL_TEMPLATE } = require("../views/EMAIL_TEMPLATE");
const _ = require("lodash");
const AdminUser = require("../model/adminUser");
const Support = require("../model/support");
const Staff = require("../model/staff");
const SupportMessage = require("../model/supportMessage");
const crypto = require("crypto");
const saltRounds = 10;

const modals = getModals();

const loginAdmin = async (req, res) => {
  try {
    const user = await AdminUser.findOne({ email: req.body.email });
    if (!user)
      return res.sendError({ statusCode: 400, message: "User not found!" });

    const result = await bcrypt.compare(req.body.password, user.password);
    if (result) {
      var accessToken = jwtSign({ userId: user._id });
      if (accessToken) {
        await user.update({
          accessToken,
          accessTokenCreatedAt: moment().utc(),
        });
        return res.sendResponse({
          data: {
            accessToken,
            user: {
              userId: user.userId,
              role: user.role,
            },
          },
          message: "User loggedin successfully!",
        });
      }
    }
    return res.sendError({
      statusCode: 401,
      message: "Password is not correct!",
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};
// const createAgent = async (req, res) => {
//   const { email, firstName, lastName } = req.body;
//   try {
//     const userEmailExists = await AdminUser.findOne({ email });
//     if (userEmailExists) {
//       return res.sendError({ message: "Email already exists!" });
//     }
//     const verifyToken = crypto.randomBytes(16).toString("hex");
//     const randomDigits = crypto.randomInt(1000, 9999); 
//     const password = `${firstName}@${lastName}${randomDigits}`;
//     const hash = await bcrypt.hash(password, 10);
//     const user = await AdminUser.create({
//       ...req.body,
//       verifyToken,
//       verifyTokenCreatedAt: moment().utc(),
//       password: hash,
//     });
//     sendMail({
//       to: email,
//       subject: "Onboarding at Locabidz",
//       html: `
//         <p>Hi ${firstName} ${lastName},</p>
//         <br/>
//         <p>Welcome to Locabidz! Below are your onboarding details:</p>
//         <p><b>Your login credentials:</b></p>
//         <p>Email: <strong>${email}</strong></p>
//         <p>Password: <strong>${password}</strong></p>
//         <p>Please verify your email by clicking <a href="${process.env.SERVER_URL}/api/v1/auth/verify-email/${verifyToken}">here</a>.</p>
//         <p>After verifying your email, use this link to log in: <a href="https://main.d2ndh80st7vh6w.amplifyapp.com/login">Login Here</a>.</p>
//         <br/>
//         <p>Best regards,<br/>The Locabidz Team</p>
//       `,
//     });

//     return res.sendResponse({
//       data: {
//         userId: user._id,
//       },
//     });
//   } catch (err) {
//     return res.sendError({ message: err.message });
//   }
// };
const createAgent = async (req, res) => {
  const { email, firstName, lastName, category } = req.body;
  try {
    const userEmailExists = await AdminUser.findOne({ email });
    if (userEmailExists) {
      return res.sendError({ message: "Email already exists!" });
    }

    const verifyToken = crypto.randomBytes(16).toString("hex");
    const randomDigits = crypto.randomInt(1000, 9999);
    const password = `${firstName}@${lastName}${randomDigits}`;
    const hash = await bcrypt.hash(password, 10);
    const user = await AdminUser.create({
      ...req.body,
      verifyToken,
      verifyTokenCreatedAt: moment().utc(),
      password: hash,
      assignedTickets: [],
    });
    const unassignedTicket = await Support.findOne({
      category: category,
      agent: null,
    }).sort({ createdAt: 1 });
    if (unassignedTicket) {
      await Support.findByIdAndUpdate(unassignedTicket._id, {
        agent: user._id,
        status: 2,
      });
      await AdminUser.findByIdAndUpdate(user._id, {
        $push: { assignedTickets: unassignedTicket._id },
      });
      const io = req.app.get("io");
      if (io) {
        io.to(user._id.toString()).emit("NEW_TICKET_ASSIGNED", {
          message: "You have been assigned a new support ticket.",
          supportTicket: unassignedTicket,
        });
      }
    }
    sendMail({
      to: email,
      subject: "Onboarding at Locabidz",
      html: `
        <p>Hi ${firstName} ${lastName},</p>
        <br/>
        <p>Welcome to Locabidz! Below are your onboarding details:</p>
        <p><b>Your login credentials:</b></p>
        <p>Email: <strong>${email}</strong></p>
        <p>Password: <strong>${password}</strong></p>
        <p>Please verify your email by clicking <a href="${process.env.SERVER_URL}/api/v1/auth/verify-email/${verifyToken}">here</a>.</p>
        <p>After verifying your email, use this link to log in: <a href="https://main.d2ndh80st7vh6w.amplifyapp.com/login">Login Here</a>.</p>
        <br/>
        <p>Best regards,<br/>The Locabidz Team</p>
      `,
    });

    return res.sendResponse({
      data: {
        userId: user._id,
      },
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const sendEmail = async (req, res) => {
  const { email, firstName, lastName, subject = "Onboarding at Locabidz", message } = req.body;

  if (!email || !firstName || !lastName || !message) {
    return res.sendError({ message: "All fields are required: email, firstName, lastName, and message." });
  }

  try {
    await sendMail({
      to: email,
      subject,
      html: `<p>Hi ${firstName} ${lastName},</p>
             <p>${message}</p>
             <p>Best regards,<br>Locabidz Team</p>`,
    });

    return res.sendResponse({
      message: "Email sent successfully!",
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};


const getCollections = async (req, res) => {
  try {
    return res.sendResponse({
      data: Object.keys(modals),
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getCollectionRecords = async (req, res) => {
  try {
    let query = {};
    if (req.body.filter?.length > 0 && req.body.filter[0]?.value !== "") {
      req.body.filter.forEach(({ by, op, value }) => {
        if (by === "status" && typeof value === "number") {
          query[by] = value;
        }
      else if (typeof value === "number") {
          query[by] = { $lte: value };
        } else if (
          by != "status" &&
          (value instanceof Date || !isNaN(Date.parse(value)))
        ) {
          query[by] = {
            $gte: moment(value).startOf("day").toDate(),
            $lte: moment(value).endOf("day").toDate(),
          };
        } else if (mongoose.Types.ObjectId.isValid(value)) {
          query[by] = {
            $eq: mongoose.Types.ObjectId(value),
          };
        } else if (typeof value === "boolean") {
          query[by] = value;
        } else {
          query[by] = {
            [op]: new RegExp(value, "i"),
          };
        }
      });
    }
    const Model = modals[req.body.model];
    const totalRows = await Model.find(query);
    const rows = await Model.find(query)
      .populate({
        strictPopulate: false,
        path: "skills",
      })
      .populate({
        strictPopulate: false,
        path: "post",
      })
      .populate({
        strictPopulate: false,
        path: "reviewedBy",
        populate: {
          path: "profilePicture",
        },
        select: {
          email: 1,
          userId: 1,
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
          profilePicture: 1,
        },
      })
      .populate({
        strictPopulate: false,
        path: "postedBy",
        select: {
          email: 1,
          userId: 1,
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      })
      .populate({
        strictPopulate: false,
        path: "proposedBy",
        select: {
          email: 1,
          userId: 1,
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      })
      .populate({
        strictPopulate: false,
        path: "user",
        select: {
          email: 1,
          userId: 1,
          role: 1,
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      })
      .populate({
        strictPopulate: false,
        path: "agent",
        select: {
          email: 1,
          userId: 1,
          role: 1,
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      })
      .populate({
        strictPopulate: false,
        path: "log",
      })
      .populate({
        strictPopulate: false,
        path: "contractId",
        populate: {
          strictPopulate: false,
          path: "chatId",
          populate: [
            {
              strictPopulate: false,
              path: "postId",
            },
            {
              strictPopulate: false,
              path: "proposalId",
              populate: {
                strictPopulate: false,
                path: "proposedBy",
                select: {
                  firstName: 1,
                  lastName: 1,
                  _id: 1,
                  createdAt: 1,
                  updatedAt: 1,
                },
              },
            },
          ],
        },
      })
      .sort({
        [req.body.sort.by]: [req.body.sort.order],
      })
      .skip(req.body.rowsPerPage * (req.body.page - 1))
      .limit(req.body.rowsPerPage);
    return res.sendResponse({
      data: {
        rows: rows,
        totalRows: totalRows.length,
        totalNoPages: Math.ceil(totalRows.length / req.body.rowsPerPage),
        perPage: req.body.rowsPerPage,
        currentPage: req.body.page,
        // columns: getColumns(Model),
      },
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getCollectionRecordDetail = async (req, res) => {
  try {
    const Model = modals[req.body.model];
    const row = await Model.findOne({
      _id: req.body._id,
    })
      .populate({
        strictPopulate: false,
        path: "profilePicture",
      })
      .populate({
        strictPopulate: false,
        path: "worker.skills",
      })
      .populate({
        strictPopulate: false,
        path: "worker.tools",
      })
      .populate({
        strictPopulate: false,
        path: "worker.certificates.attachments",
      })
      .populate({
        strictPopulate: false,
        path: "worker.experience.attachments",
      })
      .populate({
        strictPopulate: false,
        path: "worker.portfolio.attachments",
      })
      .populate({
        strictPopulate: false,
        path: "contractor.documents.attachments",
      })
      .populate({
        strictPopulate: false,
        path: "skills",
      })
      .populate({
        strictPopulate: false,
        path: "postedBy",
        select: {
          email: 1,
          userId: 1,
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      })
      .populate({
        strictPopulate: false,
        path: "user",
        select: {
          email: 1,
          userId: 1,
          role: 1,
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      })
      .populate({
        strictPopulate: false,
        path: "agent",
        select: {
          email: 1,
          userId: 1,
          role: 1,
          firstName: 1,
          lastName: 1,
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      })
      .populate({
        strictPopulate: false,
        path: "log",
      })
      .populate({
        strictPopulate: false,
        path: "acceptedProposal",
        populate: {
          strictPopulate: false,
          path: "proposedBy",
          select: {
            email: 1,
            userId: 1,
            role: 1,
            firstName: 1,
            lastName: 1,
            _id: 1,
            updatedAt: 1,
            createdAt: 1,
          },
        },
      })
      .populate({
        strictPopulate: false,
        path: "contractId",
        populate: {
          strictPopulate: false,
          path: "chatId",
          populate: [
            {
              strictPopulate: false,
              path: "postId",
            },
            {
              strictPopulate: false,
              path: "proposalId",
              populate: {
                strictPopulate: false,
                path: "proposedBy",
                select: {
                  firstName: 1,
                  lastName: 1,
                  userId: 1,
                  role: 1,
                  _id: 1,
                  createdAt: 1,
                  updatedAt: 1,
                },
              },
            },
          ],
        },
      })
      .populate({
        strictPopulate: false,
        path: "messages",
        populate: {
          path: "senderId",
          select: {
            firstName: 1,
            lastName: 1,
            _id: 1,
            updatedAt: 1,
          },
        },
      });
    return res.sendResponse({
      data: {
        row,
        // columns: getColumns(Model)
      },
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const createCollectionRecord = async (req, res) => {
  try {
    const { model, ...rest } = req.body;
    const Model = modals[req.body.model];
    const result = await Model.create(rest);
    return res.sendResponse({
      data: result,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

// const updateCollectionRecord = async (req, res) => {
//   try {
//     const { model, _id, ...rest } = req.body;
//     const Model = modals[req.body.model];
//     const result = await Model.updateOne({ _id }, rest);
//     if (req.body.model == "users") {
//       if (rest.status == USER_STATUS.APPROVED) {
//         const notif = await NotificationTemplate.findOne({
//           _id: "notification_10",
//         });
//         const user = await User.findOne({ _id: _id });
//         sendMail({
//           to: user.email,
//           subject: notif.subject,
//           html: EMAIL_TEMPLATE.replace("TEMPLATE_CONTENT", `${notif.content}`)
//             .replace("TEMPLATE_HEADER", notif.subject)
//             .replace("[FIRST_NAME]", user.firstName + " " + user.lastName),
//         });
//       } else if (rest.status == USER_STATUS.REJECTED) {
//         const notif = await NotificationTemplate.findOne({
//           _id: "notification_11",
//         });
//         const user = await User.findOne({ _id: _id });
//         sendMail({
//           to: user.email,
//           subject: notif.subject,
//           html: EMAIL_TEMPLATE.replace("TEMPLATE_CONTENT", `${notif.content}`)
//             .replace("TEMPLATE_HEADER", notif.subject)
//             .replace("[FIRST_NAME]", user.firstName + " " + user.lastName)
//             .replace("[MESSAGE]", rest.message),
//         });
//       }
//     }
//     return res.sendResponse({
//       data: result,
//     });
//   } catch (err) {
//     return res.sendError({ message: err.message });
//   }
// };
// const updateCollectionRecord = async (req, res) => {
//   console.log("updateCollectionRecord function called!");
//   console.log("Request Body:", req.body);

//   try {
//     const { model, _id, ...rest } = req.body;
//     const normalizedModel = model.toLowerCase();
//     const Model = modals[model];

//     if (!Model) {
//       console.error("Invalid model provided:", model);
//       return res.sendError({ message: "Invalid model specified." });
//     }
//     if (typeof rest.status !== "undefined") {
//       rest.status = Boolean(rest.status);
//     }

//     console.log("Before Update:", await Model.findOne({ _id }));

//     const result = await Model.updateOne({ _id }, { $set: rest });

//     console.log("After Update:", await Model.findOne({ _id }));
//     if (normalizedModel === "users") {
//       const user = await User.findOne({ _id });

//       if (!user) {
//         console.error("User not found:", _id);
//         return res.sendError({ message: "User not found." });
//       }

//       if (rest.status === USER_STATUS.APPROVED) {
//         const notif = await NotificationTemplate.findOne({ _id: "notification_10" });
//         sendMail({
//           to: user.email,
//           subject: notif.subject,
//           html: EMAIL_TEMPLATE.replace("TEMPLATE_CONTENT", notif.content)
//             .replace("TEMPLATE_HEADER", notif.subject)
//             .replace("[FIRST_NAME]", `${user.firstName} ${user.lastName}`),
//         });
//       } else if (rest.status === USER_STATUS.REJECTED) {
//         const notif = await NotificationTemplate.findOne({ _id: "notification_11" });
//         sendMail({
//           to: user.email,
//           subject: notif.subject,
//           html: EMAIL_TEMPLATE.replace("TEMPLATE_CONTENT", notif.content)
//             .replace("TEMPLATE_HEADER", notif.subject)
//             .replace("[FIRST_NAME]", `${user.firstName} ${user.lastName}`)
//             .replace("[MESSAGE]", rest.message),
//         });
//       }
//     }

//     console.log("Checking model:", model);
//     console.log("Checking isAvailable:", rest.isAvailable);
//     console.log(
//       "Condition result:",
//       ["adminuser", "adminusers"].includes(normalizedModel) && rest.isAvailable === true
//     );
//     if (["adminuser", "adminusers"].includes(normalizedModel) && rest.isAvailable === true) {
//       console.log(`Agent ${_id} is now available. Checking for queued tickets...`);
//       const agent = await AdminUser.findOne({ _id });
//       if (!agent) {
//         console.error("Agent not found:", _id);
//         return res.sendError({ message: "Agent not found." });
//       }

//       console.log(`Agent ${_id} category: ${agent.category}`);
//       const queuedTicket = await Support.findOne({
//         agent: null,
//         status: 1,
//         category: agent.category
//       }).sort({ createdAt: 1 });

//       if (!queuedTicket) {
//         console.log("No queued tickets found for this category.");
//         return res.sendResponse({ data: result });
//       }

//       console.log(`Found queued ticket: ${queuedTicket._id} with category: ${queuedTicket.category}`);
//       queuedTicket.agent = _id;
//       queuedTicket.status = 2;
//       await queuedTicket.save();
//       await AdminUser.updateOne(
//         { _id },
//         { $push: { assignedTickets: queuedTicket._id } }
//       );

//       console.log(
//         `Ticket ${queuedTicket._id} assigned to agent ${_id} (category match) and stored in AdminUser.`
//       );
//       const io = req.app.get("io");
//       if (io) {
//         console.log("Emitting NEW_TICKET_ASSIGNED event");
//         io.to(_id.toString()).emit("NEW_TICKET_ASSIGNED", {
//           message: "You have been assigned a new support ticket.",
//           supportTicket: queuedTicket,
//         });
//       } else {
//         console.error("Socket.io is NOT initialized properly.");
//       }
//     }

//     return res.sendResponse({ data: result });
//   } catch (err) {
//     console.error("Error in updateCollectionRecord:", err.message);
//     return res.sendError({ message: err.message });
//   }
// };
const updateCollectionRecord = async (req, res) => {
  try {
    const { model, _id, ...rest } = req.body;
    const Model = modals[req.body.model];
    const result = await Model.updateOne({ _id }, rest);

    if (req.body.model == "users") {
      if (rest.status == USER_STATUS.APPROVED) {
        const notif = await NotificationTemplate.findOne({ _id: "notification_10" });
        const user = await User.findOne({ _id: _id });
        sendMail({
          to: user.email,
          subject: notif.subject,
          html: EMAIL_TEMPLATE.replace("TEMPLATE_CONTENT", `${notif.content}`)
            .replace("TEMPLATE_HEADER", notif.subject)
            .replace("[FIRST_NAME]", user.firstName + " " + user.lastName),
        });
      } else if (rest.status == USER_STATUS.REJECTED) {
        const notif = await NotificationTemplate.findOne({ _id: "notification_11" });
        const user = await User.findOne({ _id: _id });
        sendMail({
          to: user.email,
          subject: notif.subject,
          html: EMAIL_TEMPLATE.replace("TEMPLATE_CONTENT", `${notif.content}`)
            .replace("TEMPLATE_HEADER", notif.subject)
            .replace("[FIRST_NAME]", user.firstName + " " + user.lastName)
            .replace("[MESSAGE]", rest.message),
        });
      }
    }

    if (["adminuser", "adminusers"].includes(model.toLowerCase()) && rest.isAvailable === true) {
      console.log(`Agent ${_id} is now available. Checking for queued tickets...`);
      const agent = await AdminUser.findOne({ _id });
      if (!agent) {
        console.error("Agent not found:", _id);
        return res.sendError({ message: "Agent not found." });
      }

      const queuedTicket = await Support.findOne({
        agent: null,
        status: 1,
        category: agent.category,
      }).sort({ createdAt: 1 });

      if (queuedTicket) {
        queuedTicket.agent = _id;
        queuedTicket.status = 2;
        await queuedTicket.save();
        await AdminUser.updateOne(
          { _id },
          { $push: { assignedTickets: queuedTicket._id } }
        );
        sendMail({
          to: agent.email, 
          subject: "New Support Ticket Assigned",
          html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2 style="color: #007bff;">New Ticket Assigned</h2>
              <p>Dear ${agent.firstName} ${agent.lastName},</p>
              <p>A new support ticket has been assigned to you.</p>
              <p><strong>Ticket ID:</strong> ${queuedTicket._id}</p>
              <p><strong>Category:</strong> ${queuedTicket.category}</p>
              <p>Please check your dashboard to respond to the user as soon as possible.</p>
              <br>
              <p>Best Regards,</p>
              <p>Locabidz Support Team</p>
            </div>
          `,
        });
        const io = req.app.get("io");
        if (io) {
          io.to(_id.toString()).emit("NEW_TICKET_ASSIGNED", {
            message: "You have been assigned a new support ticket.",
            supportTicket: queuedTicket,
          });
        }
      }
    }

    return res.sendResponse({ data: result });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const deleteCollectionRecord = async (req, res) => {
  try {
    const { model, _id } = req.body;
    const Model = modals[model];
    const result = await Model.updateOne({ _id }, { isActive: false });

    if (req.body.model == "posts") {
      const notif = await NotificationTemplate.findOne({
        _id: "notification_12",
      });
      const post = await Post.findOne({ _id: _id });

      const user = await User.findOne({ _id: post.postedBy });
      sendMail({
        to: user.email,
        subject: notif.subject,
        html: EMAIL_TEMPLATE.replace("TEMPLATE_CONTENT", `${notif.content}`)
          .replace("TEMPLATE_HEADER", notif.subject)
          .replace("[FIRST_NAME]", user.firstName + " " + user.lastName)
          .replace("[POST_ID]", post.postId)
          .replace("[MESSAGE]", req.body.message),
      });
    }
    return res.sendResponse({
      data: result,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await AdminUser.findOne({ userId: req.user.userId }).populate({
      path: "role",
      populate: {
        path: "privilege",
      },
    });
    if (!user) {
      return res.sendError({
        message: "User not found!",
        statuscode: 404,
      });
    }
    return res.sendResponse({
      success: true,
      data: {
        userId: user.userId,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    return res.sendError({ success: false, message: err.message });
  }
};

const getReports = async (req, res) => {
  try {
    const users = await User.find({});
    const jobs = await Post.find({});
    const contracts = await Contract.find({});
    const milestones = await Milestone.find({});
    const totalAmount = milestones.reduce(
      (sum, milestone) => sum + milestone.amount,
      0
    );

    const formattedTotal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(totalAmount);

    return res.sendResponse({
      data: {
        usersCount: users.length,
        jobsCount: jobs.length,
        contractsCount: contracts.length,
        transactions: formattedTotal,
      },
    });
  } catch (err) {
    return res.sendError({ message: err });
  }
};

const getGraphReports = async (req, res) => {
  try {
    const users = await User.find({});
    const jobs = await Post.find({});
    const contracts = await Contract.find({});
    const milestones = await Milestone.find({});
    const totalAmount = milestones.reduce(
      (sum, milestone) => sum + milestone.amount,
      0
    );

    let year = req.body.year || "2025";
    const parseResult = (data, year) => {
      const groupedData = _.groupBy(data, ({ createdAt }) =>
        moment(createdAt).format("MMM-YYYY")
      );

      if (year) {
        return Object.keys(groupedData)
          .filter((key) => key.endsWith(year))
          .reduce((result, key) => {
            result[key] = groupedData[key];
            return result;
          }, {});
      }

      return groupedData;
    };
    const usersGroup = parseResult(users, year);
    const jobsGroup = parseResult(jobs, year);
    const contractsGroup = parseResult(contracts, year);
    const milestonesGroup = parseResult(milestones, year);

    const result = Object.keys(usersGroup).reduce((acc, cv) => {
      acc.push({
        name: cv,
        users: usersGroup[cv].length,
        jobs: jobsGroup[cv] ? jobsGroup[cv].length : 0,
        milestones: milestonesGroup[cv] ? milestonesGroup[cv].length : 0,
        contracts: contractsGroup[cv] ? contractsGroup[cv].length : 0,
      });
      return acc;
    }, []);

    const labels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const groupedData = result.reduce((acc, entry) => {
      const [monthName, year] = entry.name.split("-");
      if (!acc[year])
        acc[year] = {
          users: Array(12).fill(0),
          jobs: Array(12).fill(0),
          contracts: Array(12).fill(0),
        };
      const monthIndex = labels.indexOf(monthName);
      if (monthIndex !== -1) {
        acc[year].users[monthIndex] = entry.users;
        acc[year].jobs[monthIndex] = entry.jobs;
        acc[year].contracts[monthIndex] = entry.contracts;
      }
      return acc;
    }, {});

    const yearlyBarData = Object.keys(groupedData).map((year) => {
      const yearData = groupedData[year];
      return {
        year,
        barData: {
          labels,
          datasets: [
            {
              label: "Active Users",
              data: yearData.users,
              backgroundColor: "#2196f3",
              barPercentage: 0.8,
              borderRadius: 3,
            },
            {
              label: "Job Posted",
              data: yearData.jobs,
              backgroundColor: "#4caf50",
              barPercentage: 0.8,
              borderRadius: 3,
            },
            {
              label: "Active Contracts",
              data: yearData.contracts,
              backgroundColor: "#EAB308",
              barPercentage: 0.8,
              borderRadius: 3,
            },
          ],
        },
      };
    });

    return res.sendResponse({
      data: yearlyBarData[0],
    });
  } catch (err) {
    return res.sendError({ message: err });
  }
};

const getRevenueChart = async (req, res) => {
  try {
    const transactions = await Transaction.find({});

    const revenueAmount = transactions.reduce(
      (sum, revenue) => sum + revenue.amount,
      0
    );

    const feeAmount = transactions.reduce((sum, fee) => sum + fee.feeAmount, 0);

    const totalAmount = revenueAmount + feeAmount;

    const revenuePercentage = ((revenueAmount / totalAmount) * 100).toFixed(2);
    const feePercentage = ((feeAmount / totalAmount) * 100).toFixed(2);

    const result = {
      labels: ["Revenue", "Fee"],
      datasets: [
        {
          label: "Revenue vs Fee",
          data: [revenuePercentage, feePercentage],
          backgroundColor: ["rgb(90, 102, 241)", "#007aff"],
        },
      ],
    };

    return res.sendResponse({
      data: result,
    });
  } catch (err) {
    return res.sendError({ message: err });
  }
};

const createMessage = async (req, res) => {
  const io = req.app.get("io");
  try {
    const { supportId, message, attachments, email } = req.body;
    const type = email ? "email" : "chat";
    let support = await Support.findOne({ _id: supportId });

    let msg = await SupportMessage.create({
      message,
      supportId,
      attachments,
      senderId: req.user._id,
      senderModel: "AdminUser",
      type,
    });

    await support.updateOne({
      $addToSet: { messages: msg._id },
      $set: { lastMessageId: msg._id },
    });

    let newMessage = await SupportMessage.findOne({ _id: msg._id })
      .populate("attachments")
      .populate({
        path: "senderId",
        select: "firstName lastName userId _id updatedAt",
      });
    io.to(`${support.user}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_SUPPORT_MESSAGE",
      data: newMessage,
    });
    io.to(`${support.agent}`).emit("RECEIVE_MESSAGE", {
      type: "NEW_SUPPORT_MESSAGE",
      data: newMessage,
    });
    const adminUsers = await AdminUser.find({ role: "admin" });
    adminUsers.forEach((member) => {
      io.to(`${member._id}`).emit("RECEIVE_MESSAGE", {
        type: "NEW_SUPPORT_MESSAGE",
        data: newMessage,
      });
    });
    if (email) {
      sendMail({
        to: email,
        subject: "Support Message from Locabidz",
        html: `
          <p>Dear Customer,</p>
          <br/>
          <p>You have received a new message regarding your support request:</p>
          <blockquote>${message}</blockquote>
          <br/>
          <p>Best regards,<br/>The Locabidz Support Team</p>
        `,
      });
    }
    return res.sendResponse({ data: newMessage });
  } catch (err) {
    console.error("Error in createMessage:", err);
    return res.sendError({ message: err.message });
  }
};

module.exports = {
  loginAdmin,
  createAgent,
  sendEmail,
  getCollections,
  getCollectionRecords,
  getCollectionRecordDetail,
  updateCollectionRecord,
  deleteCollectionRecord,
  getProfile,
  getReports,
  getGraphReports,
  createCollectionRecord,
  getRevenueChart,
  createMessage,
};
