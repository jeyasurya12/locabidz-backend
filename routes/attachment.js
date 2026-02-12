const express = require("express");
const router = express.Router();
const {
  createAttachment,
  getAttachment,
} = require("../controllers/attachment");

const { celebrate, Joi, errors, Segments } = require("celebrate");
const auth = require("../middlewares/auth");

module.exports = (app) => {

  router.post(
    "/single/upload",
    auth,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        file: Joi.string().required(),
        name: Joi.string().required(),
        type: Joi.string().required(),
        size: Joi.number().min(1).required(),
      }),
    }),
    createAttachment
  );
  
  router.get(
    "/get/:attachmentId",
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        attachmentId: Joi.string().required(),
      }),
    }),
    getAttachment
  );

  app.use("/api/v1/attachment", router);
};
