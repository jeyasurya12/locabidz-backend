const { jwtVerify } = require("../helpers/JWT");
const User = require("../model/user");

// const PersonType = db.PersonType

module.exports = async function (req, res, next) {
  try {
    const accessToken =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!accessToken) {
      return next();
    }

    const decoded = jwtVerify(accessToken);
    if (!decoded || !decoded.userId) {
      return next();
    }

    const user = await User.findOne({ _id: decoded.userId, accessToken });
    req.user = user || null;
    return next();
  } catch (err) {
    return next();
  }
};
