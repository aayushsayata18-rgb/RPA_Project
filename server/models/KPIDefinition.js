const mongoose = require('mongoose');

// Module 28: KPIDefinition Model (28_REPORTS_ANALYTICS.md Section 67)
const kpiDefinitionSchema = new mongoose.Schema(
  {
    kpiCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String
    },
    formulaDescription: {
      type: String
    },
    unit: {
      type: String,
      enum: ['COUNT', 'PERCENTAGE', 'CURRENCY_INR', 'HOURS', 'DAYS', 'RATING', 'RATIO'],
      default: 'COUNT'
    },
    targetValue: {
      type: Number
    },
    warningThreshold: {
      type: Number
    },
    criticalThreshold: {
      type: Number
    },
    direction: {
      type: String,
      enum: ['HIGHER_IS_BETTER', 'LOWER_IS_BETTER', 'TARGET_IS_BETTER'],
      default: 'HIGHER_IS_BETTER'
    },
    version: {
      type: Number,
      default: 1
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('KPIDefinition', kpiDefinitionSchema);
