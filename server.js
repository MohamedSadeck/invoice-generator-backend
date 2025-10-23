require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { requestLogger, errorLogger, errorHandler } = require('./middleware/loggerMiddleware');

const authRoutes = require('./routes/authRoutes');

const app = express();

logger.info('Starting AI Invoice Generator Backend...');

// Middleware to handle CORS
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

logger.info('CORS middleware configured');

// Connect Database
connectDB();

// Request logging middleware
app.use(requestLogger);

// Middleware
app.use(express.json());
logger.info('Body parser middleware configured');

// Routes
app.use('/api/v1/auth', authRoutes);
logger.info('Auth routes registered');

app.get('/health', (req, res) => {
    logger.debug('Health check endpoint called');
    res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server started successfully on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
