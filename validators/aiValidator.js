const logger = require('../utils/logger');

const validateParseTextFromInvoice = (req, res, next) => {
    const { text } = req.body;
    const errors = [];
    logger.debug('Validating parse text from invoice request', { textLength: text?.length });
    // Validate text
    if (!text || text.trim() === '') {
        errors.push({ field: 'text', message: 'Invoice text is required' });
    } else if (text.length < 20) {
        errors.push({ field: 'text', message: 'Invoice text must be at least 20 characters long' });
    } else if (text.length > 10000) {
        errors.push({ field: 'text', message: 'Invoice text cannot exceed 10000 characters' });
    }
    if (errors.length > 0) {
        logger.warn('Parse text from invoice validation failed', {
            errors: errors.map(e => e.field),
            textLength: text?.length
        });
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    logger.debug('Parse text from invoice validation passed');
    next();
}


module.exports = {
    validateParseTextFromInvoice,
};
