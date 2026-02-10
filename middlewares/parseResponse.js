const { jwtVerify } = require('../helpers/JWT');
const constants = require('../constants')

module.exports = function (req, res, next) {
    res.sendResponse = (o = {}) => {
        const { data = null, responseCode = constants.OK, message = "", statusCode = 200 } = o
        return res.status(statusCode).send({ data, responseCode, message })
    }
    res.sendError = (o = {}) => {
        const { errors = [], data = null, responseCode = constants.ERROR, message = "Some error occured.", statusCode = 400 } = o
        let errMsg = message.message ? message.message : message
        let errorsAr=  message && message.errors ? message.errors : errors
        if ((errMsg === 'Validation error') && errorsAr.length > 0) errMsg = errorsAr.map(e => e.message).join(',')
        return res.status(statusCode).send({ data, responseCode, message: errMsg })
    }
    next();
}