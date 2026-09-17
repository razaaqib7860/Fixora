const SLAConfig = require('../models/SLAConfig');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all SLA configurations
 * @route   GET /api/sla
 * @access  Private
 */
const getSLAs = async (req, res, next) => {
  try {
    const slas = await SLAConfig.find().sort({ category: 1 });
    res.status(200).json({
      success: true,
      count: slas.length,
      slas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update SLA configuration for a category
 * @route   PUT /api/sla/:category
 * @access  Private (ADMIN, WARDEN)
 */
const updateSLA = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { resolutionHours, priorityOverrides, description } = req.body;

    const config = await SLAConfig.findOne({ category });
    if (!config) {
      return res.status(404).json({ success: false, message: `SLA for category '${category}' not found.` });
    }

    const prevState = config.toObject();

    if (resolutionHours !== undefined) config.resolutionHours = Number(resolutionHours);
    if (priorityOverrides) config.priorityOverrides = { ...config.priorityOverrides, ...priorityOverrides };
    if (description !== undefined) config.description = description;
    config.updatedBy = req.user._id;

    await config.save();

    logAudit({
      req,
      action: 'UPDATE_SLA',
      resource: 'SLAConfig',
      resourceId: config._id,
      previousState: prevState,
      newState: config.toObject(),
    });

    res.status(200).json({
      success: true,
      message: `SLA for ${category} updated successfully.`,
      config,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSLAs,
  updateSLA,
};
