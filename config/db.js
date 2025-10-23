const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try{
        logger.info('Attempting to connect to MongoDB...', {
            uri: process.env.MONGO_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') // Hide password in logs
        });
        
        await mongoose.connect(process.env.MONGO_URI, {

        });
        
        logger.info('MongoDB Connected successfully', {
            host: mongoose.connection.host,
            name: mongoose.connection.name
        });

        // MongoDB event listeners
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', { error: err.message });
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

    }catch(err){
        logger.error('Failed to connect to MongoDB', {
            error: err.message,
            stack: err.stack
        });
        process.exit(1);
    }
}

module.exports = connectDB;