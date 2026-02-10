const { jwtVerify } = require("../helpers/JWT");
const User = require("../model/user");

module.exports = function (req, res, next) {
  try {
    const accessToken =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!accessToken)
      return res.sendError({
        success: false,
        message: "Access denied. Please login!",
        statusCode: 401
      });
    const decoded = jwtVerify(accessToken);
    console.log("s--ss>>>>>>>>>>>>>>>decoded>", decoded);
    User.findOne({ _id: decoded.userId, accessToken })
      .then((user) => {
        if (!user)
          return res.sendError({
            message: "The user does not exist or session is expired!",
            statusCode: 401
          });
        req.user = user;
        next();
      })
      .catch((err) => {
        return res
          .status(404)
          .sendError({ message: err.message || "The user does not exist",  statusCode: 401 });
      });
  } catch (err) {
    return res
      .status(400)
      .sendError({ message: err.message || "Invalid token",  statusCode: 401 });
  }
};
