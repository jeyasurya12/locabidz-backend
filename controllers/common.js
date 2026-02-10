const mongoose = require("mongoose");
const Tool = require("../model/tool");
const Skill = require("../model/skill");
const { toCamelCase } = require("../helpers/handlers");
const Notification = require("../model/notification");
const Role = require("../model/role");
const modelConstants = require("../constants/modelConstants");
const Fee = require("../model/fee");
const countries = require("../constants/countries-states-cities.json");

const getSkills = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const skills = await Skill.find({
      name: { $regex: searchQuery, $options: "i" },
    });
    return res.sendResponse({ data: skills });
  } catch (err) {
    return res.sendError({ success: false, message: err.message });
  }
};

const getTools = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const tools = await Tool.find({
      name: { $regex: searchQuery, $options: "i" },
    });
    return res.sendResponse({ data: tools });
  } catch (err) {
    return res.sendError({ success: false, message: err.message });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({});
    return res.sendResponse({ data: roles });
  } catch (err) {
    return res.sendError({ success: false, message: err.message });
  }
};

const CreateSkill = async (req, res) => {
  try {
    const skill = toCamelCase(req.body.name);
    let skillId = "";
    const skillExists = await Skill.findOne({ _id: skill });
    if (skillExists) {
      skillId = skillExists._id;
    } else {
      const newSkill = await Skill.create({ _id: skill, name: req.body.name });
      skillId = newSkill._id;
    }
    return res.sendResponse({ data: skillId });
  } catch (err) {
    return res.sendError({ success: false, message: err.message });
  }
};

const CreateTool = async (req, res) => {
  try {
    const tool = toCamelCase(req.body.name);
    let toolId = "";
    const toolExists = await Tool.findOne({ _id: tool });
    if (toolExists) {
      toolId = toolExists._id;
    } else {
      const newTool = await Tool.create({ _id: tool, name: req.body.name });
      toolId = newTool._id;
    }
    return res.sendResponse({ data: toolId });
  } catch (err) {
    return res.sendError({ success: false, message: err.message });
  }
};

const getCountries = async (req, res) => {
  let countryCode = req.params.country;
  const result = !countryCode
    ? countries.map((country) => {
        return {
          name: country.name,
          phone_code: country.phone_code,
          emoji: country.emoji,
          country: country.iso2,
          currency: country.currency.toLowerCase(),
          states: country.states.map((state) => {
            return {
              ...state,
              label: state.name,
              cities: state.cities.map((city) => {
                return {
                  ...city,
                  label: city.name,
                };
              }),
            };
          }),
          label: country.name,
        };
      })
    : (
        countries.find((country) => country.phone_code === countryCode)
          ?.states || []
      ).map((state) => {
        return {
          ...state,
          label: state.name,
          cities: state.cities.map((city) => {
            return {
              ...city,
              label: city.name,
            };
          }),
        };
      });

  try {
    return res.sendResponse({
      data: countryCode ? result : result,
    });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

const getDefaultData = async (req, res) => {
  return res.sendResponse({
    data: modelConstants,
  });
};

const getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find();
    return res.sendResponse({ data: fees });
  } catch (err) {
    return res.sendError({ success: false, message: err.message });
  }
};

const updateFee = async (req, res) => {
  try {
    const fee = await Fee.updateOne(
      { _id: req.params.feeId },
      { percentage: req.body.percentage }
    );

    return res.sendResponse({ data: fee });
  } catch (err) {
    return res.sendError({ message: err.message });
  }
};

module.exports = {
  getSkills,
  getTools,
  getRoles,
  CreateSkill,
  CreateTool,
  getDefaultData,
  getAllFees,
  getCountries,
  updateFee,
};
