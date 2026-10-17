const mongoose = require('mongoose');

const maintenanceWorkOrderSchema = new mongoose.Schema(
  {
    workOrderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRequest',
      index: true
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      index: true
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousekeepingArea'
    },
    locationDescription: {
      type: String,
      trim: true
    },
    maintenanceType: {
      type: String,
      enum: ['CORRECTIVE', 'PREVENTIVE', 'BREAKDOWN', 'EMERGENCY', 'CALIBRATION', 'INSPECTION'],
      default: 'CORRECTIVE',
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    assignedTechnicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    assignedVendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      index: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date
    },
    assignmentReason: {
      type: String
    },
    scheduledStart: {
      type: Date,
      index: true
    },
    scheduledEnd: {
      type: Date,
      index: true
    },
    actualStart: {
      type: Date
    },
    actualEnd: {
      type: Date
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'OPEN',
        'ASSIGNED',
        'SCHEDULED',
        'ACCEPTED',
        'IN_PROGRESS',
        'ON_HOLD',
        'WAITING_FOR_PARTS',
        'WAITING_FOR_VENDOR',
        'COMPLETED',
        'PENDING_VERIFICATION',
        'VERIFIED',
        'CLOSED',
        'CANCELLED',
        'REOPENED'
      ],
      default: 'OPEN',
      index: true
    },
    holdReason: {
      type: String
    },
    completionNotes: {
      type: String
    },
    downtimeStart: {
      type: Date
    },
    downtimeEnd: {
      type: Date
    },
    downtimeDurationMinutes: {
      type: Number,
      default: 0
    },
    estimatedCost: {
      type: Number,
      default: 0
    },
    actualCost: {
      type: Number,
      default: 0
    },
    costBreakdown: {
      laborCost: { type: Number, default: 0 },
      partsCost: { type: Number, default: 0 },
      vendorCost: { type: Number, default: 0 },
      otherCost: { type: Number, default: 0 }
    },
    approvalStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NOT_REQUIRED'
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    verificationNotes: {
      type: String
    },
    checklistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceChecklist'
    },
    checklistResponses: [
      {
        itemId: String,
        description: String,
        result: {
          type: String,
          enum: ['PASS', 'FAIL', 'NOT_APPLICABLE', 'NOT_CHECKED'],
          default: 'NOT_CHECKED'
        },
        notes: String
      }
    ],
    externalWorkOrderId: {
      type: String,
      trim: true,
      index: true
    },
    externalSystem: {
      type: String,
      trim: true
    },
    reopenReason: {
      type: String
    },
    reopenedAt: {
      type: Date
    },
    reopenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // SLA tracking
    slaStatus: {
      type: String,
      enum: ['NOT_STARTED', 'WITHIN_SLA', 'AT_RISK', 'BREACHED', 'COMPLETED'],
      default: 'NOT_STARTED',
      index: true
    },
    responseDue: {
      type: Date
    },
    resolutionDue: {
      type: Date
    },
    actualResponse: {
      type: Date
    },
    actualResolution: {
      type: Date
    },
    preventivePlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PreventiveMaintenancePlan'
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceContract'
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

maintenanceWorkOrderSchema.index({ workOrderId: 1, status: 1 });
maintenanceWorkOrderSchema.index({ assetId: 1, createdAt: -1 });

module.exports = mongoose.model('MaintenanceWorkOrder', maintenanceWorkOrderSchema);
