const logger = require('../utils/logger');

// Request logging middleware
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log incoming request
    logger.logRequest(req);

    // Capture response finish event
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.logResponse(req, res, duration);
    });

    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    logger.logError(err, req);
    next(err);
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    logger.error('Error handler triggered', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = {
    requestLogger,
    errorLogger,
    errorHandler
};
