var jwt = require('jsonwebtoken');

const jwtSign = (data) => {
    // { expiresIn: '1800s' }
    const token = jwt.sign(data, process.env.TOKEN_SECRET);
    if (token) return token
    return false;
}

const jwtVerify = (token) => {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    if (decoded) return decoded
    return false;
}

module.exports = {
    jwtSign,
    jwtVerify
}