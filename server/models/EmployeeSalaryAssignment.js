const mongoose = require('mongoose');

const employeeSalaryAssignmentSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    employeeIdCode: {
      type: String,
      required: true,
      index: true
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: true,
      index: true
    },
    salaryStructureCode: {
      type: String,
      required: true
    },
    version: {
      type: Number,
      default: 1
    },
    currency: {
      type: String,
      default: 'USD'
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0
    },
    components: [
      {
        code: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['EARNING', 'DEDUCTION'], required: true },
        amount: { type: Number, required: true }
      }
    ],
    effectiveFrom: {
      type: Date,
      required: true,
      index: true
    },
    effectiveTo: {
      type: Date,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'ACTIVE', 'SUPERSEDED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true
    },
    changeReason: {
      type: String,
      default: 'Initial Assignment'
    },
    requestedBy: {
      type: String,
      default: 'HR_MANAGER'
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

employeeSalaryAssignmentSchema.index({ employeeId: 1, effectiveFrom: -1 });

module.exports = mongoose.model('EmployeeSalaryAssignment', employeeSalaryAssignmentSchema);
