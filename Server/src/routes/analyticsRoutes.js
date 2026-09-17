const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { authenticateUser, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/analytics', requireRole('ADMIN', 'WARDEN', 'CARETAKER', 'HOSTEL_REPRESENTATIVE'), getAnalytics);

module.exports = router;
