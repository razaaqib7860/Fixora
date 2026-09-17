const AuditLog = require('../models/AuditLog');

/**
 * Record an action in the system audit log
 */
const logAudit = async ({ req, action, resource, resourceId, previousState, newState }) => {
  try {
    const user = req?.user;
    if (!user) return null;

    const ipAddress =
      req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';

    const entry = await AuditLog.create({
      user: user._id,
      role: user.role,
      action,
      resource,
      resourceId: String(resourceId || ''),
      previousState,
      newState,
      ipAddress,
    });

    return entry;
  } catch (error) {
    console.error('[Audit Error] Failed to log audit event:', error.message);
    return null;
  }
};

module.exports = {
  logAudit,
};
