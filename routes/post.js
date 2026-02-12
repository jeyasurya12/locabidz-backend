const express = require("express");
const router = express.Router();
const {
  createPost,
  getPosts,
  getPostDetail,
  getMyPosts,
  deletePost,
  updatePost,
  completePost,
} = require("../controllers/post");
const { celebrate, Joi, Segments } = require("celebrate");
const validateJwtToken = require("../middlewares/auth");

module.exports = (app) => {

  router.get("/get", validateJwtToken, celebrate({
    [Segments.QUERY]: Joi.object().keys({
      jobType: Joi.string().optional(),
      experienceLevel: Joi.string().optional(),
      contractorId: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    }),
  }), getPosts);

  router.get(
    "/",
    validateJwtToken,
    getMyPosts
  );

  router.get(
    "/get/:postId",
    validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        postId: Joi.string().required(),
      }),
    }),
    getPostDetail
  );

  router.post(
    "/create",
    validateJwtToken,
    celebrate(
      {
        [Segments.BODY]: Joi.object().keys({
          title: Joi.string().required(),
          description: Joi.string().required(),
          skills: Joi.array().required(),
          price: Joi.number().required(),
          location: Joi.number().optional(),
          jobType: Joi.string().required(),
          experienceLevel: Joi.string().required(),
          startDate: Joi.string().required(),
          endDate: Joi.string().required(),
          attachments: Joi.array().default([]),
        }),
      },
    ),
    createPost
  );

  router.put(
    "/complete", validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        postId: Joi.string().required(),
      }),
    }),
    completePost
  );

  router.delete(
    "/delete", validateJwtToken,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        postId: Joi.string().required(),
      }),
    }),
    deletePost
  );


  router.put(
    "/update/:postId", validateJwtToken,
    celebrate({
      [Segments.PARAMS]: Joi.object().keys({
        postId: Joi.string().required(),
      }),
      [Segments.BODY]: Joi.object().keys({
        title: Joi.string().required(),
        description: Joi.string().required(),
        skills: Joi.array().required(),
        price: Joi.number().required(),
        location: Joi.number().required(),
        jobType: Joi.string().required(),
        experienceLevel: Joi.string().required(),
        startDate: Joi.string().required(),
        endDate: Joi.string().required(),
        attachments: Joi.array().default([]),
      }),
    }),
    updatePost
  );

  app.use("/api/v1/post", router);
};
