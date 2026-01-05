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
    const { errors, isValid } = validateRegistration(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    console.log("User exists: ", userExists);

    // 🔁 USER EXISTS
    if (userExists) {

      // ✅ Already verified
      if (userExists && userExists.isVerified) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email',
          errors: { email: 'User already exists with this email' }
        });
      }

      // 🔄 Exists but NOT verified → resend verification
      const { randomToken, hashedRandomToken } = generateRandomToken();

      userExists.emailVerificationToken = hashedRandomToken;
      userExists.emailVerificationExpire = Date.now() + 60 * 60 * 1000;
      await userExists.save();

      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${randomToken}`;

    
        await sendEmail({
            to: userExists.email,
            subject: 'Verify Your Email - User Management System',
            html: emailVerificationTemplate(userExists.name, verificationUrl),
            message: `Verify your email: ${verificationUrl}`
        });
      

      return res.status(400).json({
        success: false,
        message: 'Email not verified. Verification link resent.',
        errors: {
          email: 'Email not verified. Check your inbox.'
        }
      });
    }

    // 🆕 NEW USER
    const { randomToken, hashedRandomToken } = generateRandomToken();

    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: hashedRandomToken,
      emailVerificationExpire: Date.now() + 60 * 60 * 1000
    });

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${randomToken}`;

    
    await sendEmail({
        to: user.email,
        subject: 'Verify Your Email',
        html: emailVerificationTemplate(user.name, verificationUrl),
        message: `Verify your email: ${verificationUrl}`
      });
  

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};


// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        // console.log("verify token: ", token);
        
        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }

         //hash token to compare with DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        // console.log("Hashed Token: ", hashedToken);


        // Find user with valid token
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
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
            message: 'Email verified successfully! You can now log in.'
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
           return res.status(403).json({
            success: false,
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
        const {randomToken, hashedRandomToken} = generateRandomToken();
        
        user.resetPasswordToken = hashedRandomToken;
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        // Send reset email
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${randomToken}`;
        
      
            await sendEmail({
                to: user.email,
                subject: 'Password Reset',
                html: passwordResetTemplate(user.name, resetUrl),
                message: `Reset password: ${resetUrl}`
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

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
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