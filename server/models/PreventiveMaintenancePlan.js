const mongoose = require('mongoose');

const preventiveMaintenancePlanSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
      index: true
    },
    maintenanceType: {
      type: String,
      enum: ['PREVENTIVE', 'CALIBRATION', 'INSPECTION', 'SAFETY_CHECK'],
      default: 'PREVENTIVE'
    },
    frequencyType: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'CUSTOM'],
      default: 'MONTHLY'
    },
    intervalValue: {
      type: Number,
      default: 1
    },
    nextDueDate: {
      type: Date,
      required: true,
      index: true
    },
    lastCompletedDate: {
      type: Date
    },
    checklistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceChecklist'
    },
    assignedTechnicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    instructions: {
      type: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PreventiveMaintenancePlan', preventiveMaintenancePlanSchema);
