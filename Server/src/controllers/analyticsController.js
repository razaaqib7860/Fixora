const Complaint = require('../models/Complaint');
const User = require('../models/User');

/**
 * @desc    Get aggregate analytics for Admin / Warden / Rep Dashboard
 * @route   GET /api/admin/analytics
 * @access  Private (ADMIN, WARDEN, CARETAKER, HOSTEL_REPRESENTATIVE)
 */
const getAnalytics = async (req, res, next) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const closedComplaints = await Complaint.countDocuments({ status: 'CLOSED' });
    const reopenedComplaints = await Complaint.countDocuments({ reopenCount: { $gt: 0 } });
    const overdueComplaints = await Complaint.countDocuments({
      status: { $nin: ['RESOLVED_AWAITING_CONFIRMATION', 'CLOSED'] },
      slaDeadline: { $lt: new Date() },
    });

    // 1. Complaints by Category
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 2. Complaints by Block
    const blockStats = await Complaint.aggregate([
      { $group: { _id: '$block', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 3. Status Distribution
    const statusStats = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // 4. Staff Workload (Assigned complaints count)
    const staffMembers = await User.find({ role: 'STAFF', isActive: true }).select('_id name assignedCategory');
    const staffWorkload = await Promise.all(
      staffMembers.map(async (st) => {
        const activeCount = await Complaint.countDocuments({
          assignedStaff: st._id,
          status: { $in: ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'] },
        });
        const completedCount = await Complaint.countDocuments({
          assignedStaff: st._id,
          status: 'CLOSED',
        });
        return {
          staffId: st._id,
          name: st.name,
          category: st.assignedCategory,
          activeCount,
          completedCount,
        };
      })
    );

    // 5. Average Resolution Time (in hours) for closed complaints
    const resolvedTickets = await Complaint.find({
      status: 'CLOSED',
      closedAt: { $exists: true },
    }).select('createdAt closedAt');

    let avgResolutionHours = 0;
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((acc, t) => {
        const diffMs = new Date(t.closedAt) - new Date(t.createdAt);
        return acc + diffMs / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = parseFloat((totalHours / resolvedTickets.length).toFixed(1));
    }

    res.status(200).json({
      success: true,
      metrics: {
        totalComplaints,
        closedComplaints,
        reopenedComplaints,
        overdueComplaints,
        reopenedRate: totalComplaints > 0 ? ((reopenedComplaints / totalComplaints) * 100).toFixed(1) : 0,
        avgResolutionHours,
      },
      categoryStats,
      blockStats,
      statusStats,
      staffWorkload,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
};
