const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authenticateUser, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/audit-logs', requireRole('ADMIN', 'WARDEN'), getAuditLogs);

module.exports = router;
