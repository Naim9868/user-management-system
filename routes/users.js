// User management routes

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getUserProfile,
    updateUserProfile,
    changePassword
} = require('../controllers/userController');


// console.log('protect:', protect);
// console.log('getUserProfile:', getUserProfile);
// console.log('updateUserProfile:', updateUserProfile);
// console.log('changePassword:', changePassword);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);


module.exports = router;