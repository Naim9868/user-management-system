// Input validation


const validator = require('validator');

const validateRegistration = (data) => {
    const errors = {};

    // Name validation
    if (!data.name || data.name.trim().length === 0) {
        errors.name = 'Name is required';
    } else if (data.name.length > 50) {
        errors.name = 'Name cannot be more than 50 characters';
    }

    // Email validation
    if (!data.email || !validator.isEmail(data.email)) {
        errors.email = 'Valid email is required';
    }

    // Password validation
    if (!data.password || data.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }
    

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    };
};

const validateLogin = (data) => {
    const errors = {};

    if (!data.email || !validator.isEmail(data.email)) {
        errors.email = 'Valid email is required';
    }

    if (!data.password) {
        errors.password = 'Password is required';
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    };
};

module.exports = { validateRegistration, validateLogin };