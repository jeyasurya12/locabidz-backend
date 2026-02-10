const moment = require("moment");
const getTwoDateDiffPercentage = (startDate, endDate) => {
  var startOfDate = moment(startDate),
    endDate = moment(endDate, "X"),
    todayDate = moment();
  const daysDifference = moment(endDate).diff(startOfDate, "days");
  const difference = todayDate.diff(startOfDate, "days");

  const result = Math.round((difference / daysDifference) * 100);
  return result;
};

const getColumns = (Model) => {
  let sortings = ['_id']
  return Object.values(Model.schema.paths).sort((a, b) => sortings.indexOf(b.path) - sortings.indexOf(a.path))
};

const toCamelCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
};

module.exports = { getTwoDateDiffPercentage, getColumns, toCamelCase };
