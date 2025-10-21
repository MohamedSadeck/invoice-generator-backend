const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    // Validate name
    if (!name || name.trim() === '') {
        errors.push({ field: 'name', message: 'Name is required' });
    } else if (name.length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
    } else if (name.length > 50) {
        errors.push({ field: 'name', message: 'Name cannot exceed 50 characters' });
    }

    // Validate email
    if (!email || email.trim() === '') {
        errors.push({ field: 'email', message: 'Email is required' });
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push({ field: 'email', message: 'Please provide a valid email address' });
        }
    }

    // Validate password
    if (!password) {
        errors.push({ field: 'password', message: 'Password is required' });
    } else if (password.length < 6) {
        errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
    } else if (password.length > 128) {
        errors.push({ field: 'password', message: 'Password cannot exceed 128 characters' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    // Validate email
    if (!email || email.trim() === '') {
        errors.push({ field: 'email', message: 'Email is required' });
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push({ field: 'email', message: 'Please provide a valid email address' });
        }
    }

    // Validate password
    if (!password) {
        errors.push({ field: 'password', message: 'Password is required' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

    next();
};

const validateProfileUpdate = (req, res, next) => {
    const { name, email, businessName, address, phoneNumber } = req.body;
    const errors = [];

    // Validate name (if provided)
    if (name !== undefined) {
        if (name.trim() === '') {
            errors.push({ field: 'name', message: 'Name cannot be empty' });
        } else if (name.length < 2) {
            errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
        } else if (name.length > 50) {
            errors.push({ field: 'name', message: 'Name cannot exceed 50 characters' });
        }
    }

    // Validate email (if provided)
    if (email !== undefined) {
        if (email.trim() === '') {
            errors.push({ field: 'email', message: 'Email cannot be empty' });
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push({ field: 'email', message: 'Please provide a valid email address' });
            }
        }
    }

    // Validate businessName (if provided)
    if (businessName !== undefined && businessName.length > 100) {
        errors.push({ field: 'businessName', message: 'Business name cannot exceed 100 characters' });
    }

    // Validate address (if provided)
    if (address !== undefined && address.length > 200) {
        errors.push({ field: 'address', message: 'Address cannot exceed 200 characters' });
    }

    // Validate phoneNumber (if provided)
    if (phoneNumber !== undefined && phoneNumber !== '') {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phoneNumber)) {
            errors.push({ field: 'phoneNumber', message: 'Please provide a valid phone number' });
        } else if (phoneNumber.length < 7 || phoneNumber.length > 20) {
            errors.push({ field: 'phoneNumber', message: 'Phone number must be between 7 and 20 characters' });
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

    next();
};

const validatePasswordChange = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const errors = [];

    // Validate current password
    if (!currentPassword) {
        errors.push({ field: 'currentPassword', message: 'Current password is required' });
    }

    // Validate new password
    if (!newPassword) {
        errors.push({ field: 'newPassword', message: 'New password is required' });
    } else if (newPassword.length < 6) {
        errors.push({ field: 'newPassword', message: 'New password must be at least 6 characters long' });
    } else if (newPassword.length > 128) {
        errors.push({ field: 'newPassword', message: 'New password cannot exceed 128 characters' });
    }

    // Check if passwords are different
    if (currentPassword && newPassword && currentPassword === newPassword) {
        errors.push({ message: 'New password must be different from current password' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateProfileUpdate,
    validatePasswordChange
};
