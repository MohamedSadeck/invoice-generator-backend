const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
    let token;
    
    if(
        req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')
    ){
        try{
            token = req.headers.authorization.split(' ')[1];
            logger.debug('Verifying JWT token');
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            logger.debug('JWT token verified successfully', { userId: decoded._id });

            req.user = await User.findById(decoded._id).select('-password');

            if (!req.user) {
                logger.warn('User not found for valid token', { userId: decoded._id });
                return res.status(401).json({success: false, message: "User not found"});
            }

            logger.debug('User authenticated successfully', { 
                userId: req.user._id, 
                email: req.user.email 
            });

            next();
        }catch(e){
            logger.warn('Token verification failed', { 
                error: e.message,
                ip: req.ip 
            });
            return res.status(401).json({success: false, message: "Not authorized, token failed"});
        }
    }

    if(!token){
        logger.warn('No token provided', { 
            ip: req.ip,
            url: req.originalUrl 
        });
        return res.status(401).json({success: false, message: "Not authorized, no token"});
    }
}

module.exports = { protect };