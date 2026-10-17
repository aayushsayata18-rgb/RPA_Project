const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
      index: true
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    category: {
      type: String,
      trim: true
    },
    issueType: {
      type: String,
      enum: [
        'BREAKDOWN',
        'MALFUNCTION',
        'DAMAGE',
        'PREVENTIVE_MAINTENANCE',
        'INSPECTION',
        'CALIBRATION',
        'ELECTRICAL',
        'PLUMBING',
        'HVAC',
        'IT',
        'FACILITY',
        'SAFETY',
        'OTHER'
      ],
      default: 'MALFUNCTION'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'RETURNED',
        'WORK_ORDER_CREATED',
        'CANCELLED',
        'DUPLICATE',
        'RESOLVED'
      ],
      default: 'SUBMITTED',
      index: true
    },
    source: {
      type: String,
      enum: ['WEB_PORTAL', 'MOBILE_PORTAL', 'ADMIN_CREATED', 'RPA_IMPORTED', 'EXTERNAL_SYSTEM', 'EMAIL_IMPORT'],
      default: 'WEB_PORTAL'
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    requiredBy: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    rejectionReason: {
      type: String
    },
    workOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceWorkOrder'
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
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

maintenanceRequestSchema.index({ requestId: 1, status: 1 });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
