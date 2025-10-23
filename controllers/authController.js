const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const generateToken = (id) => {
    logger.debug('Generating JWT token', { userId: id });
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
}

const registerUser = async (req, res)=>{
    const { name, email, password } = req.body;
    
    logger.info('User registration attempt', { email, name });
    
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            logger.warn('Registration failed - user already exists', { email });
            return res.status(400).json({ message: 'User already exists' });
        }
        
        const user = await User.create({
            name,
            email,
            password,
        });

        if (user) {
            logger.info('User registered successfully', { 
                userId: user._id, 
                email: user.email 
            });
            
            res.status(201).json({
                id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            logger.error('User creation failed - invalid data', { email });
            res.status(400).json({ message: 'Invalid user data' });
        }        
    } catch (error) {
        logger.error('Registration error', { 
            error: error.message, 
            stack: error.stack,
            email 
        });
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

const loginUser = async (req, res)=>{
    const { email, password } = req.body;
    
    logger.info('User login attempt', { email });
    
    try {
        const userExists = await User.findOne({ email }).select('+password');
        if (userExists && (await userExists.matchPassword(password))) {
            logger.info('User logged in successfully', { 
                userId: userExists._id, 
                email: userExists.email 
            });
            
            res.status(200).json({
                id: userExists._id,
                name: userExists.name,
                email: userExists.email,
                token: generateToken(userExists._id),
                businessName: userExists.businessName || "",
                address: userExists.address || "",
                phoneNumber: userExists.phoneNumber || "",
            });
        } else {
            logger.warn('Login failed - invalid credentials', { email });
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        logger.error('Login error', { 
            error: error.message, 
            stack: error.stack,
            email 
        });
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

const getMe = async (req, res)=>{
    logger.info('Get user profile request', { userId: req.user._id });
    
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            logger.debug('User profile retrieved successfully', { userId: user._id });
            
            res.status(200).json({
                id: user._id,
                name: user.name,
                email: user.email,
                businessName: user.businessName || "",
                address: user.address || "",
                phoneNumber: user.phoneNumber || "",
            });
        } else {
            logger.warn('Get profile failed - user not found', { userId: req.user._id });
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        logger.error('Get profile error', { 
            error: error.message, 
            stack: error.stack,
            userId: req.user?._id 
        });
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

const updateUserProfile = async (req, res)=>{
    logger.info('Update user profile request', { 
        userId: req.user._id,
        fields: Object.keys(req.body)
    });
    
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.businessName = req.body.businessName || user.businessName;
            user.address = req.body.address || user.address;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            await user.save();
            
            logger.info('User profile updated successfully', { 
                userId: user._id,
                updatedFields: Object.keys(req.body)
            });
            
            res.status(200).json({
                id: user._id,
                name: user.name,
                email: user.email,
                businessName: user.businessName,
                address: user.address,
                phoneNumber: user.phoneNumber,
            });
        } else {
            logger.warn('Update profile failed - user not found', { userId: req.user._id });
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        logger.error('Update profile error', { 
            error: error.message, 
            stack: error.stack,
            userId: req.user?._id 
        });
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateUserProfile,
}