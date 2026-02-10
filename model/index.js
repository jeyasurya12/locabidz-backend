const fs = require("fs");
const path = require("path");
const db = {};
const basename = path.basename(__filename);

const getModals = () => {
  fs.readdirSync(__dirname)
    .filter((file) => {
      return file !== 0 && file !== basename && file;
    })
    .forEach((file) => {
      const model = require(`${path.join(__dirname, file)}`);
      db[model.collection.name] = model;
    });

  return db;
};
module.exports = getModals;
