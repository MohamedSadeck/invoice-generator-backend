const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        return log;
    })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');

// Define transports
const transports = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }),

    // Error log file
    new DailyRotateFile({
        filename: path.join(logsDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true
    }),

    // Combined log file
    new DailyRotateFile({
        filename: path.join(logsDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true
    }),

    // Info log file
    new DailyRotateFile({
        filename: path.join(logsDir, 'info-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '7d',
        zippedArchive: true
    })
];

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false
});

// Create a stream object for morgan
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// Helper methods for structured logging
logger.logRequest = (req, message = 'Incoming request') => {
    logger.info(message, {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?.id || 'anonymous'
    });
};

logger.logResponse = (req, res, duration) => {
    logger.info('Request completed', {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id || 'anonymous'
    });
};

logger.logError = (error, req = null) => {
    const errorLog = {
        message: error.message,
        stack: error.stack,
        name: error.name
    };

    if (req) {
        errorLog.method = req.method;
        errorLog.url = req.originalUrl || req.url;
        errorLog.ip = req.ip || req.connection.remoteAddress;
        errorLog.userId = req.user?.id || 'anonymous';
    }

    logger.error('Error occurred', errorLog);
};

logger.logDB = (action, details = {}) => {
    logger.info(`Database operation: ${action}`, details);
};

logger.logAuth = (action, userId, details = {}) => {
    logger.info(`Auth operation: ${action}`, {
        userId,
        ...details
    });
};

module.exports = logger;
