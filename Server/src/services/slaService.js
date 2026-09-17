const Complaint = require('../models/Complaint');
const { notify } = require('./notificationService');

/**
 * Automated scan to flag overdue complaints and dispatch escalation notices
 */
const checkAndEscalateOverdue = async () => {
  try {
    const now = new Date();
    // Find complaints past SLA deadline that are not yet resolved or closed
    const overdueComplaints = await Complaint.find({
      status: { $nin: ['RESOLVED_AWAITING_CONFIRMATION', 'CLOSED'] },
      slaDeadline: { $lt: now },
      isOverdue: false, // Not yet marked
    }).populate('createdBy assignedStaff');

    for (const complaint of overdueComplaints) {
      complaint.isOverdue = true;
      complaint.timeline.push({
        previousStatus: complaint.status,
        newStatus: complaint.status,
        action: 'ESCALATED',
        changedBy: complaint.createdBy?._id || complaint._id,
        role: 'SYSTEM',
        comment: `Complaint exceeded SLA deadline (${new Date(complaint.slaDeadline).toLocaleString()}). Flagged as OVERDUE and escalated.`,
        timestamp: new Date(),
      });
      await complaint.save();

      // Notify complainant
      if (complaint.createdBy) {
        notify({
          recipient: complaint.createdBy._id,
          title: `Complaint ${complaint.complaintId} Escalated`,
          message: `Your complaint has exceeded the standard SLA window and has been automatically escalated to the Hostel Caretaker and Warden.`,
          type: 'OVERDUE',
          complaintId: complaint._id,
          email: complaint.createdBy.email,
        });
      }
    }

    if (overdueComplaints.length > 0) {
      console.log(`[SLA] Automatically flagged and escalated ${overdueComplaints.length} overdue complaint(s).`);
    }
  } catch (err) {
    console.error('[SLA Service Error]:', err.message);
  }
};

module.exports = {
  checkAndEscalateOverdue,
};
