const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    version: {
      type: Number,
      default: 1
    },
    components: [
      {
        code: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['EARNING', 'DEDUCTION'], required: true },
        calculationType: {
          type: String,
          enum: ['FIXED', 'PERCENTAGE', 'HOURLY', 'CONFIGURED'],
          default: 'FIXED'
        },
        formula: { type: String, default: null }, // e.g. "0.4 * BASE"
        percentageOf: { type: String, default: null }, // e.g. "BASIC"
        percentageValue: { type: Number, default: 0 },
        defaultValue: { type: Number, default: 0 },
        isTaxable: { type: Boolean, default: true }
      }
    ],
    effectiveFrom: {
      type: Date,
      required: true,
      index: true
    },
    effectiveTo: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUPERSEDED'],
      default: 'ACTIVE',
      index: true
    },
    createdBy: {
      type: String,
      required: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

salaryStructureSchema.index({ code: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);
