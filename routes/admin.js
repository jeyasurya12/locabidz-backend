const express = require("express");
const router = express.Router();
const {
  getCollections,
  loginAdmin,
  getCollectionRecords,
  getCollectionRecordDetail,
  updateCollectionRecord,
  deleteCollectionRecord,
  getProfile,
  getReports,
  createCollectionRecord,
  getGraphReports,
  getRevenueChart,
  createMessage,
  createAgent,
  sendEmail,
} = require("../controllers/admin");

const { celebrate, Joi, errors, Segments } = require("celebrate");
const validateAdmin = require("../middlewares/validateAdmin");
const strongPasswordRegex =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
const stringPassswordError =
  "Password must be strong. At least one upper case alphabet. At least one lower case alphabet. At least one digit. At least one special character. Minimum eight in length";

module.exports = (app) => {
  router.post(
    "/auth",
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string()
          .regex(strongPasswordRegex)
          .message(stringPassswordError)
          .required(),
      }),
    }),
    loginAdmin
  );
  router.post(
    "/create",
    validateAdmin,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required(),
        // password: Joi.string()
        //   .regex(strongPasswordRegex)
        //   .message(stringPassswordError)
        //   .required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        role: Joi.string().required(),
        category: Joi.string().required(),
      }),
    }),
    createAgent
  );
  router.post(
    "/send-email",
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        subject: Joi.string().optional(),
        message: Joi.string().required(),
      }),
    }),
    sendEmail
  );
  
  router.get("/profile", validateAdmin, getProfile);
  router.get("/collections", validateAdmin, getCollections);
  router.post(
    "/collection/get/records",
    validateAdmin,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        filter: Joi.array()
          .items(
            Joi.object()
              .keys({
                by: Joi.string().optional().allow(""),
                op: Joi.string().optional().default("$regex"),
                value: Joi.alternatives()
                  .try(
                    Joi.string().allow(""),
                    Joi.boolean(),
                    Joi.number(),
                    Joi.object()
                  )
                  .optional(),
              })
              .optional()
          )
          .optional(),
        sort: Joi.object()
          .keys({
            by: Joi.string().required().default("createdAt"),
            order: Joi.number().required(1),
          })
          .optional(),
        model: Joi.string().required(),
        page: Joi.number().required().default(1),
        rowsPerPage: Joi.number().required().default(10),
      }),
    }),
    getCollectionRecords
  );
  router.post(
    "/collection/get/record/detail",
    validateAdmin,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        model: Joi.string().required(),
        _id: Joi.string().optional().allow(null, ""),
      }),
    }),
    getCollectionRecordDetail
  );

  router.put(
    "/collection/get/record/update",
    validateAdmin,
    celebrate({
      [Segments.BODY]: Joi.object()
        .keys({
          model: Joi.string().required(),
          _id: Joi.string().required(),
        })
        .unknown(),
    }),
    updateCollectionRecord
  );
  router.post(
    "/collection/get/record/create",
    validateAdmin,
    celebrate({
      [Segments.BODY]: Joi.object()
        .keys({
          model: Joi.string().required(),
        })
        .unknown(),
    }),
    createCollectionRecord
  );

  router.delete(
    "/collection/get/record/delete",
    validateAdmin,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        model: Joi.string().required(),
        _id: Joi.string().required(),
        message: Joi.string().optional(),
      }),
    }),
    deleteCollectionRecord
  );

  router.get("/reports", validateAdmin, getReports);

  router.get("/graph", validateAdmin, getGraphReports);

  router.get("/revenue", validateAdmin, getRevenueChart);

  router.post(
    "/support",
    validateAdmin,
    celebrate({
      [Segments.BODY]: Joi.object().keys({
        message: Joi.string().required(),
        supportId: Joi.string().required(),
        attachments: Joi.array().default([]),
        email: Joi.string().email().optional(),
      }),
    }),
    createMessage
  );
  app.use("/api/v1/admin", router);
};
