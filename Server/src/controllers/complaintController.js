const Complaint = require('../models/Complaint');
const SLAConfig = require('../models/SLAConfig');
const User = require('../models/User');
const { uploadMultipleFiles } = require('../services/storageService');

// Helper to generate next sequential Complaint ID (e.g. CMP-2026-0001)
const generateComplaintId = async () => {
  const year = new Date().getFullYear();
  const prefix = `CMP-${year}-`;

  const latest = await Complaint.findOne({ complaintId: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 })
    .select('complaintId');

  let seq = 1;
  if (latest && latest.complaintId) {
    const parts = latest.complaintId.split('-');
    if (parts.length === 3) {
      seq = parseInt(parts[2], 10) + 1;
    }
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
};

// Helper to calculate SLA deadline
const calculateSLADeadline = async (category, priority = 'MEDIUM') => {
  let config = await SLAConfig.findOne({ category });
  if (!config) {
    config = await SLAConfig.findOne({ category: 'Other' });
  }

  let hours = 24;
  if (config) {
    if (priority && config.priorityOverrides && config.priorityOverrides[priority]) {
      hours = config.priorityOverrides[priority];
    } else {
      hours = config.resolutionHours || 24;
    }
  } else if (priority === 'EMERGENCY') {
    hours = 1;
  }

  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private (STUDENT)
 */
const createComplaint = async (req, res, next) => {
  try {
    const {
      category,
      problemType,
      customProblem,
      description,
      priority = 'MEDIUM',
      block,
      roomNumber,
    } = req.body;

    if (!category || !problemType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category, problem type, and description are required.',
      });
    }

    const finalBlock = block ? block.trim() : req.user.block;
    const finalRoom = roomNumber ? roomNumber.trim() : req.user.roomNumber;

    if (!finalBlock || !finalRoom) {
      return res.status(400).json({
        success: false,
        message: 'Hostel block and room number are required to locate the issue.',
      });
    }

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = await uploadMultipleFiles(req.files);
    }

    const complaintId = await generateComplaintId();
    const slaDeadline = await calculateSLADeadline(category, priority);

    const initialTimeline = [
      {
        previousStatus: '',
        newStatus: 'PENDING',
        action: 'COMPLAINT_RAISED',
        changedBy: req.user._id,
        role: req.user.role,
        comment: 'Complaint registered by student',
        timestamp: new Date(),
      },
    ];

    const complaint = await Complaint.create({
      complaintId,
      createdBy: req.user._id,
      block: finalBlock,
      roomNumber: finalRoom,
      category,
      problemType,
      customProblem: customProblem || '',
      description: description.trim(),
      priority,
      attachments,
      status: 'PENDING',
      slaDeadline,
      timeline: initialTimeline,
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('createdBy', 'name email phoneNumber block roomNumber')
      .populate('timeline.changedBy', 'name role');

    res.status(201).json({
      success: true,
      message: 'Complaint created successfully.',
      complaint: populatedComplaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complaints list with filters & role scoping
 * @route   GET /api/complaints
 * @access  Private
 */
const getComplaints = async (req, res, next) => {
  try {
    const {
      status,
      category,
      priority,
      block,
      search,
      isOverdue,
      assignedToMe,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Role Scoping
    if (req.user.role === 'STUDENT') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'STAFF') {
      if (assignedToMe === 'true') {
        query.assignedStaff = req.user._id;
      } else {
        query.$or = [
          { assignedStaff: req.user._id },
          { category: req.user.assignedCategory },
        ];
      }
    }

    // Filter by Status
    if (status) {
      if (status === 'active') {
        query.status = { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'] };
      } else if (status === 'unresolved') {
        query.status = { $nin: ['CLOSED'] };
      } else {
        query.status = status;
      }
    }

    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (block) query.block = block;

    if (isOverdue === 'true') {
      query.status = { $nin: ['RESOLVED_AWAITING_CONFIRMATION', 'CLOSED'] };
      query.slaDeadline = { $lt: new Date() };
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$and = [
        {
          $or: [
            { complaintId: searchRegex },
            { problemType: searchRegex },
            { description: searchRegex },
            { roomNumber: searchRegex },
          ],
        },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('createdBy', 'name email phoneNumber block roomNumber')
      .populate('assignedStaff', 'name email phoneNumber assignedCategory')
      .populate('timeline.changedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    complaints.forEach((c) => c.checkOverdue());

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single complaint details with authorization guard
 * @route   GET /api/complaints/:id
 * @access  Private
 */
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('createdBy', 'name email phoneNumber block roomNumber')
      .populate('assignedStaff', 'name email phoneNumber assignedCategory')
      .populate('timeline.changedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found.',
      });
    }

    complaint.checkOverdue();

    // Authorization Guard
    if (req.user.role === 'STUDENT') {
      if (complaint.createdBy._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: You cannot view complaints filed by other students.',
        });
      }
    } else if (req.user.role === 'STAFF') {
      const isAssigned =
        complaint.assignedStaff &&
        complaint.assignedStaff._id.toString() === req.user._id.toString();
      const isCategoryMatch = complaint.category === req.user.assignedCategory;
      if (!isAssigned && !isCategoryMatch) {
        return res.status(403).json({
          success: false,
          message: `Access forbidden: You are not authorized to view ${complaint.category} complaints.`,
        });
      }
    }

    res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign complaint to staff member
 * @route   PATCH /api/complaints/:id/assign
 * @access  Private (CARETAKER, ADMIN, WARDEN, or STAFF self-accepting)
 */
const assignComplaint = async (req, res, next) => {
  try {
    const { staffId, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found.',
      });
    }

    // Determine target staff
    let targetStaffId = staffId;
    if (!targetStaffId && req.user.role === 'STAFF') {
      // Staff self-accepting complaint
      targetStaffId = req.user._id;
    }

    if (!targetStaffId) {
      return res.status(400).json({
        success: false,
        message: 'Staff member identifier is required for assignment.',
      });
    }

    const staffUser = await User.findById(targetStaffId);
    if (!staffUser || staffUser.role !== 'STAFF' || !staffUser.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not an active maintenance staff member.',
      });
    }

    const prevStatus = complaint.status;
    complaint.assignedStaff = staffUser._id;

    // Transition status to ASSIGNED if currently PENDING
    if (complaint.status === 'PENDING') {
      complaint.status = 'ASSIGNED';
    }

    const actionText =
      req.user.role === 'STAFF'
        ? `Complaint accepted by ${staffUser.name}`
        : `Assigned to ${staffUser.name} (${staffUser.assignedCategory || 'Staff'})`;

    complaint.timeline.push({
      previousStatus: prevStatus,
      newStatus: complaint.status,
      action: 'ASSIGNED_STAFF',
      changedBy: req.user._id,
      role: req.user.role,
      comment: comment || actionText,
      timestamp: new Date(),
    });

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('createdBy', 'name email phoneNumber block roomNumber')
      .populate('assignedStaff', 'name email phoneNumber assignedCategory')
      .populate('timeline.changedBy', 'name role');

    res.status(200).json({
      success: true,
      message: `Complaint assigned to ${staffUser.name} successfully.`,
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update complaint status by Staff or Admin (IN_PROGRESS, RESOLVED_AWAITING_CONFIRMATION)
 * @route   PATCH /api/complaints/:id/status
 * @access  Private (STAFF, CARETAKER, ADMIN, WARDEN)
 */
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found.',
      });
    }

    // CRITICAL SECURITY ENFORCEMENT: Staff CANNOT close complaints
    if (status === 'CLOSED') {
      return res.status(403).json({
        success: false,
        message:
          'Staff Resolved ≠ Closed. Only the student who raised the complaint can confirm resolution and close the ticket.',
      });
    }

    // Role check for staff: must belong to staff category or be the assigned staff
    if (req.user.role === 'STAFF') {
      const isAssigned =
        complaint.assignedStaff &&
        complaint.assignedStaff.toString() === req.user._id.toString();
      const isCategoryMatch = complaint.category === req.user.assignedCategory;
      if (!isAssigned && !isCategoryMatch) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update complaints outside your category.',
        });
      }
    }

    const previousStatus = complaint.status;

    // Validate state transitions
    if (status === 'IN_PROGRESS') {
      if (!['ASSIGNED', 'PENDING', 'REOPENED'].includes(previousStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition to IN_PROGRESS from status: ${previousStatus}`,
        });
      }

      // If unassigned, assign to this staff member
      if (!complaint.assignedStaff && req.user.role === 'STAFF') {
        complaint.assignedStaff = req.user._id;
      }

      complaint.status = 'IN_PROGRESS';
      complaint.timeline.push({
        previousStatus,
        newStatus: 'IN_PROGRESS',
        action: 'WORK_STARTED',
        changedBy: req.user._id,
        role: req.user.role,
        comment: note || 'Staff commenced maintenance work.',
        timestamp: new Date(),
      });
    } else if (status === 'RESOLVED_AWAITING_CONFIRMATION') {
      if (!['IN_PROGRESS', 'ASSIGNED'].includes(previousStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot mark resolved from status: ${previousStatus}. Work must be IN_PROGRESS.`,
        });
      }

      // Mandatory resolution note requirement
      if (!note || !note.trim()) {
        return res.status(400).json({
          success: false,
          message:
            'A resolution note explaining the fix is mandatory before marking a complaint as resolved.',
        });
      }

      complaint.status = 'RESOLVED_AWAITING_CONFIRMATION';
      complaint.resolutionNote = note.trim();
      complaint.resolvedAt = new Date();

      complaint.timeline.push({
        previousStatus,
        newStatus: 'RESOLVED_AWAITING_CONFIRMATION',
        action: 'MARKED_RESOLVED',
        changedBy: req.user._id,
        role: req.user.role,
        comment: note.trim(),
        timestamp: new Date(),
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Invalid target status: ${status}. Valid transitions are IN_PROGRESS and RESOLVED_AWAITING_CONFIRMATION.`,
      });
    }

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('createdBy', 'name email phoneNumber block roomNumber')
      .populate('assignedStaff', 'name email phoneNumber assignedCategory')
      .populate('timeline.changedBy', 'name role');

    res.status(200).json({
      success: true,
      message:
        status === 'RESOLVED_AWAITING_CONFIRMATION'
          ? 'Complaint marked as resolved. Awaiting student verification.'
          : 'Complaint status updated successfully.',
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add progress note to complaint without changing status
 * @route   POST /api/complaints/:id/notes
 * @access  Private (STAFF, CARETAKER, ADMIN, WARDEN)
 */
const addWorkNote = async (req, res, next) => {
  try {
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Work note text is required.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found.',
      });
    }

    complaint.timeline.push({
      previousStatus: complaint.status,
      newStatus: complaint.status,
      action: 'WORK_NOTE_ADDED',
      changedBy: req.user._id,
      role: req.user.role,
      comment: comment.trim(),
      timestamp: new Date(),
    });

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('createdBy', 'name email phoneNumber block roomNumber')
      .populate('assignedStaff', 'name email phoneNumber assignedCategory')
      .populate('timeline.changedBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Work note added to timeline.',
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student verifies and CONFIRMS resolution (transitions to CLOSED)
 * @route   POST /api/complaints/:id/verify
 * @access  Private (STUDENT ONLY - creator)
 */
const verifyAndCloseComplaint = async (req, res, next) => {
  try {
    const { rating = 5, comment = '' } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found.',
      });
    }

    // NON-NEGOTIABLE SECURITY: Verify caller is the creator student
    if (complaint.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the student who raised this complaint can confirm resolution and close the ticket.',
      });
    }

    // Status MUST be RESOLVED_AWAITING_CONFIRMATION
    if (complaint.status !== 'RESOLVED_AWAITING_CONFIRMATION') {
      return res.status(400).json({
        success: false,
        message: `Complaint cannot be confirmed closed. Current status is ${complaint.status}, not RESOLVED_AWAITING_CONFIRMATION.`,
      });
    }

    const previousStatus = complaint.status;
    complaint.status = 'CLOSED';
    complaint.closedAt = new Date();
    complaint.studentFeedback = {
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      comment: comment ? comment.trim() : '',
      confirmedAt: new Date(),
    };

    complaint.timeline.push({
      previousStatus,
      newStatus: 'CLOSED',
      action: 'STUDENT_CONFIRMED',
      changedBy: req.user._id,
      role: req.user.role,
      comment: comment?.trim()
        ? `Student confirmed resolution (Rating: ${rating}/5): ${comment.trim()}`
        : `Student confirmed resolution (Rating: ${rating}/5)`,
      timestamp: new Date(),
    });

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('createdBy', 'name email phoneNumber block roomNumber')
      .populate('assignedStaff', 'name email phoneNumber assignedCategory')
      .populate('timeline.changedBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Thank you! Complaint confirmed as resolved and successfully closed.',
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student REJECTS resolution (transitions to REOPENED)
 * @route   POST /api/complaints/:id/reopen
 * @access  Private (STUDENT ONLY - creator)
 */
const rejectAndReopenComplaint = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A reason explaining why the issue is not fixed is required to reopen the complaint.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found.',
      });
    }

    // NON-NEGOTIABLE SECURITY: Verify caller is the creator student
    if (complaint.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the student who raised this complaint can reopen it.',
      });
    }

    // Status MUST be RESOLVED_AWAITING_CONFIRMATION
    if (complaint.status !== 'RESOLVED_AWAITING_CONFIRMATION') {
      return res.status(400).json({
        success: false,
        message: `Complaint cannot be reopened. Current status is ${complaint.status}, not RESOLVED_AWAITING_CONFIRMATION.`,
      });
    }

    const previousStatus = complaint.status;
    complaint.status = 'REOPENED';
    complaint.reopenedAt = new Date();
    complaint.reopenReason = reason.trim();
    complaint.reopenCount = (complaint.reopenCount || 0) + 1;

    complaint.timeline.push({
      previousStatus,
      newStatus: 'REOPENED',
      action: 'STUDENT_REOPENED',
      changedBy: req.user._id,
      role: req.user.role,
      comment: `Student reported issue not fixed: "${reason.trim()}"`,
      timestamp: new Date(),
    });

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('createdBy', 'name email phoneNumber block roomNumber')
      .populate('assignedStaff', 'name email phoneNumber assignedCategory')
      .populate('timeline.changedBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Complaint reopened and returned to the active work queue for immediate staff attention.',
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard summary stats
 * @route   GET /api/complaints/stats/summary
 * @access  Private
 */
const getSummaryStats = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'STUDENT') {
      filter.createdBy = req.user._id;
    } else if (req.user.role === 'STAFF') {
      filter.$or = [
        { assignedStaff: req.user._id },
        { category: req.user.assignedCategory },
      ];
    }

    const [
      total,
      pending,
      assigned,
      inProgress,
      awaitingConfirmation,
      reopened,
      closed,
      overdue,
    ] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.countDocuments({ ...filter, status: 'PENDING' }),
      Complaint.countDocuments({ ...filter, status: 'ASSIGNED' }),
      Complaint.countDocuments({ ...filter, status: 'IN_PROGRESS' }),
      Complaint.countDocuments({ ...filter, status: 'RESOLVED_AWAITING_CONFIRMATION' }),
      Complaint.countDocuments({ ...filter, status: 'REOPENED' }),
      Complaint.countDocuments({ ...filter, status: 'CLOSED' }),
      Complaint.countDocuments({
        ...filter,
        status: { $nin: ['RESOLVED_AWAITING_CONFIRMATION', 'CLOSED'] },
        slaDeadline: { $lt: new Date() },
      }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        assigned,
        inProgress,
        active: pending + assigned + inProgress + reopened,
        awaitingConfirmation,
        reopened,
        closed,
        overdue,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  addWorkNote,
  verifyAndCloseComplaint,
  rejectAndReopenComplaint,
  getSummaryStats,
};
