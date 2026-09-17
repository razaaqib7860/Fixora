const express = require('express');
const router = express.Router();
const { getSLAs, updateSLA } = require('../controllers/slaController');
const { authenticateUser, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/', getSLAs);
router.put('/:category', requireRole('ADMIN', 'WARDEN'), updateSLA);

module.exports = router;
