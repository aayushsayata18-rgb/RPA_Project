const mongoose = require('mongoose');

const payrollInputVersionSchema = new mongoose.Schema(
  {
    payrollInputId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollInput',
      required: true,
      index: true
    },
    payrollPeriodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollPeriod',
      required: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    version: {
      type: Number,
      required: true
    },
    snapshotData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    changeReason: {
      type: String,
      required: true
    },
    sourceVersions: [
      {
        sourceType: String,
        sourceId: String,
        version: Number
      }
    ],
    createdBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

payrollInputVersionSchema.index({ payrollPeriodId: 1, employeeId: 1, version: 1 });

module.exports = mongoose.model('PayrollInputVersion', payrollInputVersionSchema);
