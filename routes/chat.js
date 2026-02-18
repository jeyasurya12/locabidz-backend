const express = require("express");
const router = express.Router();
const {
  createMessage,
  getMessages,
  getChats,
  createChat,
  createDirectChat,
} = require("../controllers/chat");
const validateJwtToken = require("../middlewares/auth");

const { celebrate, Joi, Segments } = require("celebrate");

module.exports = (app) => {

  router.post(
    "/create",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        postId: Joi.string().required(),
        proposalId: Joi.string().required(),
      }),
    }),
    createChat
  );

  router.post(
    "/create-direct",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        receiverId: Joi.string().required(),
      }),
    }),
    createDirectChat
  );

  router.post(
    "/send",
    validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        message: Joi.string().required(),
        receiverChatId: Joi.string().required(),
        attachments: Joi.array().default([]),
      }),
    }),
    createMessage
  );

  router.get(
    "/messages/get/:receiverChatId",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        receiverChatId: Joi.string().required(),
      }),
    }),
    getMessages
  );

  router.get("/get", validateJwtToken, getChats);

  app.use("/api/v1/chat", router);
};
