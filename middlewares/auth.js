const { jwtVerify } = require("../helpers/JWT");
const User = require("../model/user");

module.exports = async function (req, res, next) {
  try {
    const accessToken =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!accessToken) {
      return res.sendError({
        message: "Access denied. Please login!",
        statusCode: 401,
      });
    }

    const decoded = jwtVerify(accessToken);
    if (!decoded || !decoded.userId) {
      return res.sendError({
        message: "Invalid token",
        statusCode: 401,
      });
    }

    const user = await User.findOne({ _id: decoded.userId, accessToken });
    if (!user) {
      return res.sendError({
        message: "The user does not exist or session is expired!",
        statusCode: 401,
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.sendError({
      message: err.message || "Invalid token",
      statusCode: 401,
    });
  }
};
