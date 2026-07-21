// =======================================
// WORKFLOW SERVICES ENTRY POINT
// =======================================

const projectWorkflow = require("./projectWorkflow");
const quotationWorkflow = require("./quotationWorkflow");
const invoiceWorkflow = require("./invoiceWorkflow");
const paymentWorkflow = require("./paymentWorkflow");
const stockWorkflow = require("./stockWorkflow");

module.exports = {
  // Project workflow
  projectWorkflow,
  
  // Quotation workflow
  quotationWorkflow,
  
  // Invoice workflow
  invoiceWorkflow,
  
  // Payment workflow
  paymentWorkflow,
  
  // Stock workflow
  stockWorkflow
};