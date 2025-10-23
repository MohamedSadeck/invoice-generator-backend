const express = require('express');

const { registerUser, loginUser, getMe, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const {validateRegister, validateLogin, validateProfileUpdate} = require('../validators');

const router = express.Router();

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.route('/me').get(protect, getMe).put(protect, validateProfileUpdate, updateUserProfile);

module.exports = router;