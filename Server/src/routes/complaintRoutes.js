const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  addWorkNote,
  verifyAndCloseComplaint,
  rejectAndReopenComplaint,
  getSummaryStats,
} = require('../controllers/complaintController');
const { authenticateUser, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All complaint routes require valid authentication
router.use(authenticateUser);

// Complaints CRUD
router.post('/', upload.array('attachments', 5), createComplaint);
router.get('/', getComplaints);
router.get('/stats/summary', getSummaryStats);
router.get('/:id', getComplaintById);

// Staff / Administrative Actions
router.patch(
  '/:id/assign',
  requireRole('STAFF', 'CARETAKER', 'ADMIN', 'WARDEN'),
  assignComplaint
);

router.patch(
  '/:id/status',
  requireRole('STAFF', 'CARETAKER', 'ADMIN', 'WARDEN'),
  updateComplaintStatus
);

router.post(
  '/:id/notes',
  requireRole('STAFF', 'CARETAKER', 'ADMIN', 'WARDEN'),
  addWorkNote
);

// Student Verification Workflows (STUDENT only)
router.post(
  '/:id/verify',
  requireRole('STUDENT'),
  verifyAndCloseComplaint
);

router.post(
  '/:id/reopen',
  requireRole('STUDENT'),
  rejectAndReopenComplaint
);

module.exports = router;
