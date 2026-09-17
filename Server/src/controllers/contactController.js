const HostelContact = require('../models/HostelContact');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all hostel contacts
 * @route   GET /api/hostel/contacts
 * @access  Private
 */
const getContacts = async (req, res, next) => {
  try {
    const contacts = await HostelContact.find().sort({ sortOrder: 1, createdAt: 1 });
    res.status(200).json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update hostel contact
 * @route   POST /api/hostel/contacts
 * @access  Private (ADMIN, WARDEN)
 */
const saveContact = async (req, res, next) => {
  try {
    const { title, role, name, phoneNumber, email, location, availability, isEmergency, id } = req.body;

    if (!title || !role || !name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Title, role, name, and phone number are required.',
      });
    }

    let contact;
    if (id) {
      contact = await HostelContact.findByIdAndUpdate(
        id,
        { title, role, name, phoneNumber, email, location, availability, isEmergency: !!isEmergency },
        { new: true }
      );
    } else {
      contact = await HostelContact.create({
        title,
        role,
        name,
        phoneNumber,
        email,
        location,
        availability,
        isEmergency: !!isEmergency,
      });
    }

    logAudit({
      req,
      action: id ? 'UPDATE_CONTACT' : 'CREATE_CONTACT',
      resource: 'HostelContact',
      resourceId: contact._id,
      newState: contact.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Contact saved successfully.',
      contact,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a hostel contact
 * @route   DELETE /api/hostel/contacts/:id
 * @access  Private (ADMIN, WARDEN)
 */
const deleteContact = async (req, res, next) => {
  try {
    await HostelContact.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Contact removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  saveContact,
  deleteContact,
};
