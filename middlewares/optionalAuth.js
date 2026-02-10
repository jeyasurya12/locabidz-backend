const { jwtVerify } = require("../helpers/JWT");
const User = require("../model/user");

// const PersonType = db.PersonType

module.exports = function (req, res, next) {
  try {
    const accessToken =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (accessToken) {
      const decoded = jwtVerify(accessToken);
      console.log("s-s-s>>>>>>>>>>>>",decoded)

      User.findOne({
        userId: decoded.userId,
        accessToken
      })
        .then((user) => {
          req.user = user;
          next();
        })
        .catch((err) => {
          next();
        });
    } else {
      next();
    }
  } catch (err) {
    next();
  }
};
