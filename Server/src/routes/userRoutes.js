const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getStaffList,
  getAllUsers,
  createUserByAdmin,
  toggleUserStatus,
} = require('../controllers/userController');
const { authenticateUser, requireRole } = require('../middleware/authMiddleware');

// Authenticated user profile routes
router.use(authenticateUser);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Staff list for assigning complaints (Caretakers, Admins, Wardens)
router.get('/staff', requireRole('CARETAKER', 'ADMIN', 'WARDEN'), getStaffList);

// Admin / Warden user management routes
router.get('/admin/all', requireRole('ADMIN', 'WARDEN'), getAllUsers);
router.post('/admin/create', requireRole('ADMIN', 'WARDEN'), createUserByAdmin);
router.patch('/admin/:id/status', requireRole('ADMIN', 'WARDEN'), toggleUserStatus);

module.exports = router;
