// JWT token generation

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Generate random token for email verification/password reset
const generateRandomToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

module.exports = { generateToken, generateRandomToken };