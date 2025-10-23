const logger = require('../utils/logger');

const validateImageUpload = (req, res, next) => {
    const errors = [];

    logger.debug('Validating image upload', { 
        hasFile: !!req.file,
        mimetype: req.file?.mimetype,
        size: req.file?.size 
    });

    // Check if file was uploaded
    if (!req.file) {
        errors.push({ field: 'image', message: 'Image file is required' });
    } else {
        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            errors.push({ 
                field: 'image', 
                message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed' 
            });
        }

        // Validate file size (e.g., max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (req.file.size > maxSize) {
            errors.push({ 
                field: 'image', 
                message: 'File size too large. Maximum size is 10MB' 
            });
        }

        // Validate minimum file size (e.g., at least 1KB)
        const minSize = 1024; // 1KB in bytes
        if (req.file.size < minSize) {
            errors.push({ 
                field: 'image', 
                message: 'File size too small. Minimum size is 1KB' 
            });
        }
    }

    if (errors.length > 0) {
        logger.warn('Image upload validation failed', { 
            errors: errors.map(e => e.field),
            mimetype: req.file?.mimetype,
            size: req.file?.size 
        });
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

    logger.debug('Image upload validation passed');
    next();
};

const validateTextPrompt = (req, res, next) => {
    const { prompt } = req.body;
    const errors = [];

    logger.debug('Validating text prompt', { promptLength: prompt?.length });

    // Validate prompt
    if (!prompt || prompt.trim() === '') {
        errors.push({ field: 'prompt', message: 'Prompt text is required' });
    } else if (prompt.length < 10) {
        errors.push({ field: 'prompt', message: 'Prompt must be at least 10 characters long' });
    } else if (prompt.length > 5000) {
        errors.push({ field: 'prompt', message: 'Prompt cannot exceed 5000 characters' });
    }

    if (errors.length > 0) {
        logger.warn('Text prompt validation failed', { 
            errors: errors.map(e => e.field),
            promptLength: prompt?.length 
        });
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

    logger.debug('Text prompt validation passed');
    next();
};

const validateInvoiceGenerationPrompt = (req, res, next) => {
    const { prompt, clientInfo, items } = req.body;
    const errors = [];

    logger.debug('Validating invoice generation prompt', { 
        hasPrompt: !!prompt,
        hasClientInfo: !!clientInfo,
        itemCount: items?.length 
    });

    // Validate prompt if provided
    if (prompt && prompt.length > 2000) {
        errors.push({ field: 'prompt', message: 'Prompt cannot exceed 2000 characters' });
    }

    // Validate clientInfo if provided
    if (clientInfo) {
        if (typeof clientInfo !== 'object') {
            errors.push({ field: 'clientInfo', message: 'Client info must be an object' });
        } else {
            if (clientInfo.email && clientInfo.email.trim() !== '') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(clientInfo.email)) {
                    errors.push({ field: 'clientInfo.email', message: 'Please provide a valid email address' });
                }
            }
        }
    }

    // Validate items if provided
    if (items) {
        if (!Array.isArray(items)) {
            errors.push({ field: 'items', message: 'Items must be an array' });
        } else if (items.length > 100) {
            errors.push({ field: 'items', message: 'Cannot process more than 100 items at once' });
        }
    }

    if (errors.length > 0) {
        logger.warn('Invoice generation prompt validation failed', { 
            errors: errors.map(e => e.field)
        });
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

    logger.debug('Invoice generation prompt validation passed');
    next();
};

const validateAIRequest = (req, res, next) => {
    const { requestType, data } = req.body;
    const errors = [];

    logger.debug('Validating AI request', { requestType });

    // Validate request type
    if (!requestType || requestType.trim() === '') {
        errors.push({ field: 'requestType', message: 'Request type is required' });
    } else {
        const validTypes = ['generate', 'extract', 'enhance', 'summarize'];
        if (!validTypes.includes(requestType)) {
            errors.push({ 
                field: 'requestType', 
                message: `Request type must be one of: ${validTypes.join(', ')}` 
            });
        }
    }

    // Validate data
    if (!data) {
        errors.push({ field: 'data', message: 'Data is required' });
    } else if (typeof data !== 'object') {
        errors.push({ field: 'data', message: 'Data must be an object' });
    }

    if (errors.length > 0) {
        logger.warn('AI request validation failed', { 
            errors: errors.map(e => e.field),
            requestType 
        });
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

    logger.debug('AI request validation passed', { requestType });
    next();
};

module.exports = {
    validateImageUpload,
    validateTextPrompt,
    validateInvoiceGenerationPrompt,
    validateAIRequest
};
