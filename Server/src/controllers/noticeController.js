const Notice = require('../models/Notice');
const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get active notices
 * @route   GET /api/notices
 * @access  Private
 */
const getNotices = async (req, res, next) => {
  try {
    const { priority, category } = req.query;
    const filter = { isActive: true };

    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const notices = await Notice.find(filter)
      .populate('createdBy', 'name role')
      .sort({ priority: -1, publishedAt: -1 });

    res.status(200).json({
      success: true,
      count: notices.length,
      notices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new notice
 * @route   POST /api/notices
 * @access  Private (ADMIN, WARDEN, HOSTEL_REPRESENTATIVE)
 */
const createNotice = async (req, res, next) => {
  try {
    const { title, description, priority = 'NORMAL', category = 'GENERAL', targetBlocks, expiresAt } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Notice title and description are required.',
      });
    }

    const notice = await Notice.create({
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      targetBlocks: targetBlocks || [],
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: req.user._id,
    });

    // Notify resident students if Important or Urgent
    if (['IMPORTANT', 'URGENT'].includes(priority)) {
      const students = await User.find({ role: 'STUDENT', isActive: true }).select('_id email');
      for (const st of students) {
        notify({
          recipient: st._id,
          title: `Notice: ${title}`,
          message: description.slice(0, 120) + '...',
          type: 'NOTICE_PUBLISHED',
          email: st.email,
        });
      }
    }

    logAudit({
      req,
      action: 'CREATE_NOTICE',
      resource: 'Notice',
      resourceId: notice._id,
      newState: notice.toObject(),
    });

    res.status(201).json({
      success: true,
      message: 'Notice published successfully.',
      notice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit notice
 * @route   PUT /api/notices/:id
 * @access  Private (ADMIN, WARDEN, HOSTEL_REPRESENTATIVE)
 */
const updateNotice = async (req, res, next) => {
  try {
    const { title, description, priority, category, isActive } = req.body;
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    const prevState = notice.toObject();

    if (title) notice.title = title.trim();
    if (description) notice.description = description.trim();
    if (priority) notice.priority = priority;
    if (category) notice.category = category;
    if (isActive !== undefined) notice.isActive = isActive;

    await notice.save();

    logAudit({
      req,
      action: 'UPDATE_NOTICE',
      resource: 'Notice',
      resourceId: notice._id,
      previousState: prevState,
      newState: notice.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Notice updated successfully.',
      notice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete / Archive notice
 * @route   DELETE /api/notices/:id
 * @access  Private (ADMIN, WARDEN)
 */
const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    logAudit({
      req,
      action: 'DELETE_NOTICE',
      resource: 'Notice',
      resourceId: req.params.id,
      previousState: notice.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
};
