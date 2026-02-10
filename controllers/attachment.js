const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const Attachment = require("../model/attachment");

const createAttachment = async (req, res) => {
  try {
    const { file, name, type, size } = req.body;
    const randomString = crypto.randomBytes(4).toString("hex");
    const fileExtension = path.extname(name) || ".bin";
    const filename = `${path.basename(
      name,
      fileExtension
    )}-${randomString}${fileExtension}`;
    const filePath = path.join(__dirname, "../public/uploads/", filename);
    const buffer = Buffer.from(file, "base64");
    fs.writeFileSync(filePath, buffer);
    const attachment = await Attachment.create({
      filename: filename,
      filePath: filePath,
      mimeType: type,
      size: size,
    });
    return res.sendResponse({
      data: {
        attachment_id: attachment._id,
      },
    });
  } catch (err) {
    return res.sendError({ message: err });
  }
};

const getAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findOne({
      _id: req.params.attachmentId,
    });
    return res.sendResponse({
      data: attachment,
    });
  } catch (err) {
    return res.sendError({ message: err });
  }
};

module.exports = { createAttachment, getAttachment };
