const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Notice description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'IMPORTANT', 'URGENT'],
      default: 'NORMAL',
      index: true,
    },
    category: {
      type: String,
      enum: ['GENERAL', 'MAINTENANCE', 'WATER_ELECTRICITY', 'EMERGENCY'],
      default: 'GENERAL',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    targetBlocks: [
      {
        type: String,
        trim: true,
      },
    ], // Empty means all blocks
  },
  {
    timestamps: true,
  }
);

// Seed default notices if collection is empty
noticeSchema.statics.seedDefaults = async function (adminUser) {
  const count = await this.countDocuments();
  if (count === 0 && adminUser) {
    const notices = [
      {
        title: 'Emergency Water Pipeline Maintenance in Block A & B',
        description: 'Water supply will be suspended for overhead tank cleaning and pipe maintenance on Saturday between 9:00 AM and 1:00 PM. Please store sufficient drinking water in advance.',
        priority: 'URGENT',
        category: 'WATER_ELECTRICITY',
        createdBy: adminUser._id,
        targetBlocks: ['Block A', 'Block B'],
      },
      {
        title: 'Hostel Night Curfew & Gate Timing Reminder',
        description: 'All resident students must return to their respective hostel blocks before 10:30 PM. Digital biometric attendance will be recorded at the security desk.',
        priority: 'IMPORTANT',
        category: 'GENERAL',
        createdBy: adminUser._id,
      },
      {
        title: 'Campus High-Speed Wi-Fi Firmware Upgrade Scheduled',
        description: 'Access points across all hostel wings will undergo routine security patching tonight at 2:00 AM. Intermittent disconnects of 10-15 minutes are expected.',
        priority: 'NORMAL',
        category: 'MAINTENANCE',
        createdBy: adminUser._id,
      },
    ];
    await this.insertMany(notices);
    console.log('[Notice] Default notices seeded.');
  }
};

module.exports = mongoose.model('Notice', noticeSchema);
