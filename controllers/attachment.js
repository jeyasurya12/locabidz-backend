const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const Attachment = require("../model/attachment");

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const createAttachment = async (req, res) => {
  try {
    const { file, name, type, size } = req.body;

    const maxBytes = Number(process.env.ATTACHMENT_MAX_BYTES || DEFAULT_MAX_BYTES);
    if (!ALLOWED_MIME_TYPES.has(type)) {
      return res.sendError({ message: "Unsupported file type" });
    }
    if (typeof size !== "number" || size <= 0 || size > maxBytes) {
      return res.sendError({ message: "File too large" });
    }

    const randomString = crypto.randomBytes(4).toString("hex");
    const fileExtension = path.extname(name) || ".bin";
    const filename = `${path.basename(
      name,
      fileExtension
    )}-${randomString}${fileExtension}`;
    const filePath = path.join(__dirname, "../public/uploads/", filename);

    let buffer;
    try {
      buffer = Buffer.from(file, "base64");
    } catch (e) {
      return res.sendError({ message: "Invalid file encoding" });
    }
    if (buffer.length > maxBytes) {
      return res.sendError({ message: "File too large" });
    }

    await fs.promises.writeFile(filePath, buffer);
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
    return res.sendError({ message: err.message || "Upload failed" });
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
    return res.sendError({ message: err.message || "Error" });
  }
};

module.exports = { createAttachment, getAttachment };
