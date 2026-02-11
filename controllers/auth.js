const { jwtSign } = require("../helpers/JWT");
const User = require("../model/user");
const moment = require("moment");
const bcrypt = require("bcrypt");
const sendMail = require("../helpers/sendMail");
const crypto = require("crypto");
const { createConnectAccount } = require("../lib/libStripe");
const Log = require("../model/log");
const saltRounds = 10;

const signup = async (req, res) => {
  const { email, phoneNumber } = req.body;
  try {
    const userEmailExists = await User.findOne({ email });
    if (userEmailExists) {
      return res.sendError({ message: "Email already exists!" });
    }
    const userPhoneExists = await User.findOne({ phoneNumber });
    if (userPhoneExists) {
      return res.sendError({ message: "Phonenumber already exists!" });
    }
    const verifyToken = crypto.randomBytes(16).toString("hex");
    const hash = await bcrypt.hash(req.body.password, saltRounds);
    const user = await User.create({
      ...req.body,
      verifyToken,
      verifyTokenCreatedAt: moment().utc(),
      password: hash,
    });

    if (process.env.STRIPE_CONNECT_ENABLED === "true") {
      try {
        const account = await createConnectAccount({ user: user });
        if (!account) {
          return res.sendError({ message: "Failed to create an account!" });
        }
        await user.updateOne({
          account: account.id,
        });
      } catch (stripeErr) {
        return res.sendError({
          message: stripeErr?.message || "Failed to create Stripe Connect account.",
        });
      }
    }
  //   try {
  //     await sendMail({
  //       to: email,
  //       html: `
  //     <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
  //         <h2 style="color: #007BFF;">Verify Your Email</h2>
  //         <p>Hello,</p>
  //         <p>Thank you for signing up! Please verify your email address to access Locabidz.</p>
  //         <p>Click the button below to complete your verification:</p>
  //         <a href="${process.env.SERVER_URL}/api/v1/auth/verify-email/${verifyToken}" 
  //            style="display: inline-block; padding: 10px 20px; background-color: #007BFF; 
  //                   color: #ffffff; text-decoration: none; border-radius: 5px;">
  //            Verify Email
  //         </a>
  //         <p>If the button above does not work, you can also copy and paste the following link into your browser:</p>
  //         <p><a href="${process.env.SERVER_URL}/api/v1/auth/verify-email/${verifyToken}">
  //             ${process.env.SERVER_URL}/api/v1/auth/verify-email/${verifyToken}
  //         </a></p>
  //         <p>If you did not request this, please ignore this email.</p>
  //         <p>Best regards,<br>Locabidz Team</p>
  //     </div>
  // `,
  //     });
  //   } catch (mailErr) {
  //     if (process.env.NODE_ENV !== "production") {
  //       console.log(
  //         "Signup email failed; continuing in non-production. Verify URL:",
  //         `${process.env.SERVER_URL}/api/v1/auth/verify-email/${verifyToken}`
  //       );
  //     } else {
  //       return res.sendError({
  //         message:
  //           mailErr?.message ||
  //           "Failed to send verification email. Please contact support.",
  //       });
  //     }
  //   }
    await Log.create({
      log: "log_2",
      user: user._id,
      values: {
        status: "success",
      },
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

const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select("+password");
    if (!user)
      return res.sendError({ statusCode: 401, message: "User not found!" });
    if (!user.isActive)
      return res.sendError({ statusCode: 401, message: "User is inactive!" });
    // if (user.verifyToken)
    //   return res.sendError({
    //     statusCode: 401,
    //     message: "Please verify your email to login!",
    //   });

    // Check for failed login attempts within the last 10 minutes
    const tenMinutesAgo = moment().utc().subtract(10, "minutes").toDate();
    const recentFailedAttempts = await Log.find({
      user: user._id,
      "values.status": "failed",
      createdAt: { $gte: tenMinutesAgo },
    });

    if (recentFailedAttempts.length >= 5) {
      // Lock the account and send a response
      // user.isActive = false;
      // await user.save();
      await Log.create({
        log: "log_1",
        user: user._id,
        values: {
          status: "Flagged",
        },
      });
      return res.sendError({
        statusCode: 403,
        message:
          "Account locked due to multiple failed login attempts. Please try again in 10 minutes.",
      });
    }

    // Validate password
    const result = await bcrypt.compare(req.body.password, user.password);
    if (result) {
      // Generate access token
      const accessToken = jwtSign({ userId: user._id });
      if (accessToken) {
        await user.update({
          accessToken,
          accessTokenCreatedAt: moment().utc(),
        });
        await Log.create({
          log: "log_1",
          user: user._id,
          values: {
            status: "success",
          },
        });
        return res.sendResponse({
          data: {
            accessToken,
            user: {
              email: user.email,
              userId: user._id,
            },
            role: user.role,
            isUpdated: user.isUpdated,
          },
          message: "User logged in successfully!",
        });
      }
    }

    // Log failed login attempt
    await Log.create({
      log: "log_1",
      user: user._id,
      values: {
        status: "failed",
      },
    });
    return res.sendError({
      statusCode: 401,
      message: "Password is not correct!",
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const verifyEmail = async (req, res) => {
  const { verifyToken } = req.params;
  const skipVerifyTokenExpiry = true;
  try {
    const user = await User.findOne({
      verifyToken,
    });
    if (!user || !user.isActive)
      return res.sendError({
        message: "Invalid User or User already verified!",
      });
    if (
      skipVerifyTokenExpiry ||
      moment(user.verifyTokenCreatedAt).utc().add(5, "minutes") > moment.utc()
    ) {
      await user.update({ verifyTokenCreatedAt: null, verifyToken: null });
      // return res.redirect(process.env.CLIENT_DOMAIN);
      return res.render("verification_success", {
        message: "Verification successful! You can now log in to the app.",
      });
    } else {
      return res.sendError({ message: "Email verification link is expired!" });
    }
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const resendEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const verifyToken = crypto.randomBytes(16).toString("hex");
    const user = await User.findOne({ email });
    if (!user) return res.sendError({ message: "User not exists!" });
    await user.update({
      accessToken: null,
      accessTokenCreatedAt: null,
      verifyToken,
      verifyTokenCreatedAt: moment().utc(),
    });
    sendMail({
      to: email,
      html: `<b>Please verify this url to access Locabidz <a href="${process.env.SERVER_DOMAIN}/api/v1/auth/verify-email/${verifyToken}">Click here</a></b>`,
    });
    return res.sendResponse({ data: { userId: user.userId, verifyToken } });
  } catch (err) {
    return res.sendError({ message: err });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({
      email,
    });
    if (!user) return res.sendError({ message: "User not found!" });
    if (!user.isActive) return res.sendError({ message: "User is inactive!" });
    // const forgotPasswordToken = crypto.randomBytes(16).toString("hex");
    // await user.update({
    //   forgotPasswordToken,
    //   forgotPasswordTokenCreatedAt: moment().utc(),
    // });
    // sendMail({
    //   to: user.email,
    //   html: `<b>Please verify this url to change your password Locabidz ${process.env.CLIENT_DOMAIN}/api/v1/auth/update-password/${forgotPasswordToken}</b>`,
    // });

    const forgotPasswordToken = Math.floor(
      1000 + Math.random() * 9000
    ).toString();

    // Update user with the token and the creation time
    await user.update({
      forgotPasswordToken,
      forgotPasswordTokenCreatedAt: moment().utc(),
    });

    // Send the email with the token
    sendMail({
      to: user.email,
      subject: "Your One-Time Password (OTP) for Password Reset",
      html: `
        <p>Dear ${user.name},</p>
        <p>We received a request to reset your password for your Locabidz account. Please use the following One-Time Password (OTP) to reset your password:</p>
        <h2>${forgotPasswordToken}</h2>
        <p>This OTP is valid for the next 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Best regards,<br/>The Locabidz Team</p>
      `,
    });

    return res.sendResponse({
      message: "Please check your email to change your password",
      data: {
        userId: user.userId,
        forgotPasswordToken,
        email: user.email,
      },
    });
  } catch (err) {
    return res.sendError({ message: err });
  }
};

const verifyOtp = async (req, res) => {
  const { forgotPasswordToken } = req.body;
  const skipVerifyTokenExpiry = true;

  try {
    const user = await User.findOne({
      forgotPasswordToken,
    });
    if (!user) return res.sendError({ message: "Invalid OTP!" });
    if (!user.isActive) return res.sendError({ message: "User is inactive!" });
    if (
      !skipVerifyTokenExpiry &&
      moment(user.forgotPasswordTokenCreatedAt).utc().add(5, "minutes") <
        moment.utc()
    ) {
      return res.sendError({ message: "Invalid OTP!" });
    }
    return res.sendResponse({
      otp: true,
      message: "Your password has been updated successfully",
    });
  } catch (err) {
    return res.sendError({ message: err });
  }
};

const updatePassword = async (req, res) => {
  const { forgotPasswordToken, newPassword } = req.body;
  const skipVerifyTokenExpiry = true;

  try {
    const user = await User.findOne({
      forgotPasswordToken,
    });
    if (!user) return res.sendError({ message: "Invalid OTP!" });
    if (!user.isActive) return res.sendError({ message: "User is inactive!" });
    if (
      !skipVerifyTokenExpiry &&
      moment(user.forgotPasswordTokenCreatedAt).utc().add(5, "minutes") <
        moment.utc()
    ) {
      return res.sendError({ message: "Invalid OTP!" });
    }
    const hash = bcrypt.hashSync(newPassword, saltRounds);
    await user.update({
      forgotPasswordToken: null,
      forgotPasswordTokenCreatedAt: null,
      password: hash,
    });
    sendMail({
      to: user.email,
      html: `<b>Your password has been updated successfully</b>`,
    });
    await Log.create({
      log: "log_3",
      user: user._id,
      values: {
        status: "success",
      },
    });
    return res.sendResponse({
      data: { userId: user.userId },
      message: "Your password has been updated successfully",
    });
  } catch (err) {
    return res.sendError({ message: err });
  }
};

module.exports = {
  login,
  signup,
  verifyEmail,
  resendEmail,
  verifyEmail,
  forgotPassword,
  updatePassword,
  verifyOtp,
};
