const assistantService = require("./assistantService");
const queryAnalyzer = require("./queryAnalyzer");
const responseGenerator = require("./responseGenerator");

module.exports = {
  ...assistantService,
  ...queryAnalyzer,
  ...responseGenerator,
};