// Authentication logic

const User = require('../models/Users');
const { generateToken, generateRandomToken } = require('../utils/generateToken');
const { sendEmail, emailVerificationTemplate, passwordResetTemplate } = require('../utils/emailService');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        // Validate input
        const { errors, isValid } = validateRegistration(req.body);
        if (!isValid) {
            console.log(isValid);
            return res.status(400).json({ errors });
        }

        const { name, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ 
                errors: { email: 'User already exists with this email' } 
            });
        }

        // Generate email verification token
        const emailVerificationToken = generateRandomToken();
        
        // Create user
        const user = await User.create({
            name,
            email,
            password,
            emailVerificationToken,
            emailVerificationExpire: Date.now() + 60 * 60 * 1000 // 1 hour
        });

        // Generate JWT token
        const token = generateToken(user._id);

        // Send verification email
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${emailVerificationToken}`;
        
        await sendEmail({
            email: user.email,
            subject: 'Verify Your Email - User Management System',
            html: emailVerificationTemplate(user.name, verificationUrl)
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for verification.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Server error during registration',
            error: error.message 
        });
    }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }

        // Find user with valid token
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Update user
        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Server error during email verification' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        // Validate input
        const { errors, isValid } = validateLogin(req.body);
        if (!isValid) {
            return res.status(400).json({ errors });
        }

        const { email, password } = req.body;

        // Check if user exists and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ 
                errors: { email: 'Invalid credentials' } 
            });
        }

        // Check if password matches
        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({ 
                errors: { password: 'Invalid credentials' } 
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({ 
                message: 'Please verify your email before logging in' 
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        
        // Don't reveal if user exists or not
        if (!user) {
            return res.json({ 
                message: 'If an account with that email exists, a reset link has been sent' 
            });
        }

        // Generate reset token
        const resetToken = generateRandomToken();
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        // Send reset email
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request - User Management System',
            html: passwordResetTemplate(user.name, resetUrl)
        });

        res.json({ 
            message: 'If an account with that email exists, a reset link has been sent' 
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password and clear reset token
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};

module.exports = {
    registerUser,
    verifyEmail,
    loginUser,
    forgotPassword,
    resetPassword
};