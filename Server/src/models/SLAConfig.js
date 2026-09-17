const mongoose = require('mongoose');

const slaConfigSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    resolutionHours: {
      type: Number,
      required: [true, 'Default resolution hours are required'],
      min: [1, 'Resolution hours must be at least 1'],
    },
    priorityOverrides: {
      EMERGENCY: { type: Number, default: 1 },
      HIGH: { type: Number, default: 6 },
      MEDIUM: { type: Number, default: 24 },
      LOW: { type: Number, default: 48 },
    },
    description: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Default predefined SLAs
const defaultSLAs = [
  { category: 'Emergency', resolutionHours: 1, priorityOverrides: { EMERGENCY: 1, HIGH: 2, MEDIUM: 4, LOW: 8 } },
  { category: 'Plumbing', resolutionHours: 12, priorityOverrides: { EMERGENCY: 1, HIGH: 4, MEDIUM: 12, LOW: 24 } },
  { category: 'Electrical', resolutionHours: 24, priorityOverrides: { EMERGENCY: 1, HIGH: 6, MEDIUM: 24, LOW: 48 } },
  { category: 'Cleaning', resolutionHours: 6, priorityOverrides: { EMERGENCY: 1, HIGH: 3, MEDIUM: 6, LOW: 12 } },
  { category: 'Furniture', resolutionHours: 48, priorityOverrides: { EMERGENCY: 6, HIGH: 24, MEDIUM: 48, LOW: 72 } },
  { category: 'Internet/Wi-Fi', resolutionHours: 12, priorityOverrides: { EMERGENCY: 2, HIGH: 6, MEDIUM: 12, LOW: 24 } },
  { category: 'Room', resolutionHours: 24, priorityOverrides: { EMERGENCY: 2, HIGH: 8, MEDIUM: 24, LOW: 48 } },
  { category: 'Bathroom', resolutionHours: 12, priorityOverrides: { EMERGENCY: 1, HIGH: 4, MEDIUM: 12, LOW: 24 } },
  { category: 'Security', resolutionHours: 2, priorityOverrides: { EMERGENCY: 1, HIGH: 2, MEDIUM: 6, LOW: 12 } },
  { category: 'Water', resolutionHours: 6, priorityOverrides: { EMERGENCY: 1, HIGH: 3, MEDIUM: 6, LOW: 12 } },
  { category: 'Other', resolutionHours: 24, priorityOverrides: { EMERGENCY: 2, HIGH: 8, MEDIUM: 24, LOW: 48 } },
];

slaConfigSchema.statics.seedDefaults = async function () {
  for (const item of defaultSLAs) {
    const existing = await this.findOne({ category: item.category });
    if (!existing) {
      await this.create(item);
    }
  }
};

module.exports = mongoose.model('SLAConfig', slaConfigSchema);
