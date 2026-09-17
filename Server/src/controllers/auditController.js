const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get audit logs with pagination & filters
 * @route   GET /api/admin/audit-logs
 * @access  Private (ADMIN, WARDEN)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, resource, page = 1, limit = 20 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (resource) query.resource = resource;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
