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
    //Create a random token string
    const randomToken =  crypto.randomBytes(32).toString('hex');

    //Hash token for secure storage in DB
    const hashedRandomToken = crypto.createHash('sha256').update(randomToken).digest('hex');
    
    return {randomToken, hashedRandomToken};
};

module.exports = { generateToken, generateRandomToken };