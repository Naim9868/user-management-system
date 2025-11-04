// Admin routes

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser
} = require('../controllers/adminController');

// Admin only routes
router.get('/users', protect, admin, getAllUsers);
router.get('/users/:id', protect, admin, getUserById);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;