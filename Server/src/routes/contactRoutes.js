const express = require('express');
const router = express.Router();
const { getContacts, saveContact, deleteContact } = require('../controllers/contactController');
const { authenticateUser, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/contacts', getContacts);
router.post('/contacts', requireRole('ADMIN', 'WARDEN', 'CARETAKER'), saveContact);
router.delete('/contacts/:id', requireRole('ADMIN', 'WARDEN'), deleteContact);

module.exports = router;
