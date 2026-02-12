const { jwtVerify } = require("../helpers/JWT");
const AdminUser = require("../model/adminUser");

// const PersonType = db.PersonType

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
    if (!decoded) {
      return res.sendError({
        message: "Invalid token",
        statusCode: 401,
      });
    }

    const user = await AdminUser.findOne({ accessToken });
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
