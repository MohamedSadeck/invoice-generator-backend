// Central export file for all validators
const authValidator = require('./authValidator');
const invoiceValidator = require('./invoiceValidator');
const aiValidator = require('./aiValidator');

module.exports = {
    ...authValidator,
    ...invoiceValidator,
    ...aiValidator
};
