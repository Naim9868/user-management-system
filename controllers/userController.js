// User management logic

const User = require('../models/Users');
const validator = require('validator');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id); //this user id comes from the protect middleware(authMiddleware.js)

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const userId = req.user.id;  //this user id comes from the protect middleware(authMiddleware.js)

        // Basic validation
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Name is required' });
        }

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }

        // Check if email is already taken by another user
        const emailExists = await User.findOne({ 
            email, 
            _id: { $ne: userId } 
        });

        if (emailExists) {
            return res.status(400).json({ message: 'Email already taken' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { name, email },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error while updating profile' });
    }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; //this user id comes from the protect middleware(authMiddleware.js)

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Get user with password
        const user = await User.findById(userId).select('+password');

        // Verify current password
        const isCurrentPasswordValid = await user.matchPassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error while changing password' });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    changePassword
};