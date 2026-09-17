const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema(
  {
    previousStatus: {
      type: String,
      default: '',
    },
    newStatus: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g. COMPLAINT_RAISED, ASSIGNED_STAFF, WORK_STARTED, NOTE_ADDED, MARKED_RESOLVED, CONFIRMED_CLOSED, REOPENED, ESCALATED
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      enum: ['IMAGE', 'AUDIO'],
      required: true,
    },
    originalName: {
      type: String,
      default: '',
    },
    size: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Complaint creator is required'],
      index: true,
    },
    block: {
      type: String,
      required: [true, 'Hostel block is required'],
      trim: true,
      index: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    problemType: {
      type: String,
      required: [true, 'Problem type is required'],
      trim: true,
    },
    customProblem: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    attachments: [attachmentSchema],
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
      default: 'MEDIUM',
      index: true,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'ASSIGNED',
        'IN_PROGRESS',
        'RESOLVED_AWAITING_CONFIRMATION',
        'CLOSED',
        'REOPENED',
      ],
      default: 'PENDING',
      index: true,
    },
    slaDeadline: {
      type: Date,
      index: true,
    },
    isOverdue: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: '',
    },
    resolutionAttachment: {
      type: String,
      default: '',
    },
    studentFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
      confirmedAt: { type: Date },
    },
    reopenReason: {
      type: String,
      trim: true,
      default: '',
    },
    reopenCount: {
      type: Number,
      default: 0,
    },
    timeline: [timelineEventSchema],
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    reopenedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast filtered searches and queries
complaintSchema.index({ createdBy: 1, createdAt: -1 });
complaintSchema.index({ status: 1, category: 1 });
complaintSchema.index({ assignedStaff: 1, status: 1 });
complaintSchema.index({ block: 1, status: 1 });
complaintSchema.index({ isOverdue: 1, status: 1 });

// Helper method to check if overdue dynamically
complaintSchema.methods.checkOverdue = function () {
  if (['RESOLVED_AWAITING_CONFIRMATION', 'CLOSED'].includes(this.status)) {
    return false;
  }
  if (this.slaDeadline && new Date() > this.slaDeadline) {
    this.isOverdue = true;
    return true;
  }
  this.isOverdue = false;
  return false;
};

module.exports = mongoose.model('Complaint', complaintSchema);
