const express = require('express');
const router = express.Router();
const { getNotices, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { authenticateUser, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/', getNotices);
router.post('/', requireRole('ADMIN', 'WARDEN', 'HOSTEL_REPRESENTATIVE'), createNotice);
router.put('/:id', requireRole('ADMIN', 'WARDEN', 'HOSTEL_REPRESENTATIVE'), updateNotice);
router.delete('/:id', requireRole('ADMIN', 'WARDEN'), deleteNotice);

module.exports = router;
