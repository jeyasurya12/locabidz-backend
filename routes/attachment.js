const express = require("express");
const router = express.Router();
const {
  createAttachment,
  getAttachment,
} = require("../controllers/attachment");

const { celebrate, Joi, errors, Segments } = require("celebrate");
const path = require("path");
const crypto = require("crypto");

const multer = require("multer");
const auth = require("../middlewares/auth");
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../public/uploads/"));
    },
    filename: (req, file, cb) => {
      // randomBytes function will generate a random name
      let customFileName = crypto.randomBytes(18).toString("hex");
      // get file extension from original file name
      let fileExtension = path.extname(file.originalname).split(".")[1];
      cb(null, customFileName + "." + fileExtension);
    },
  }),
});

module.exports = (app) => {

  router.post("/single/upload", createAttachment);
  
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
