const mongoose = require('mongoose');

const maintenanceExceptionSchema = new mongoose.Schema(
  {
    exceptionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      trim: true
    },
    exceptionType: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'ASSET_MISMATCH',
        'DUPLICATE_ASSET',
        'DUPLICATE_REQUEST',
        'WORK_ORDER_MISMATCH',
        'TECHNICIAN_UNAVAILABLE',
        'VENDOR_UNAVAILABLE',
        'SCHEDULING_CONFLICT',
        'PART_UNAVAILABLE',
        'INVENTORY_SYNC_FAILURE',
        'EXTERNAL_CMMS_UNAVAILABLE',
        'UNKNOWN_EXTERNAL_STATE',
        'SERVICE_DOCUMENT_MISSING',
        'INSPECTION_REQUIRED',
        'VERIFICATION_REQUIRED',
        'BILLING_MISMATCH',
        'CONTRACT_EXPIRED',
        'NOTIFICATION_FAILURE',
        'EQUIPMENT_DOWNTIME_BREACH',
        'MAINTENANCE_SLA_BREACH',
        'CALIBRATION_EXPIRED',
        'SAFETY_BREACH',
        'GENERAL_EXCEPTION'
      ],
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      index: true
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRequest',
      index: true
    },
    workOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceWorkOrder',
      index: true
    },
    description: {
      type: String,
      required: true
    },
    source: {
      type: String,
      default: 'SYSTEM'
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'WAITING_FOR_EXTERNAL_SYSTEM', 'WAITING_FOR_USER', 'RESOLVED', 'CANCELLED'],
      default: 'OPEN',
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolution: {
      type: String
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    },
    rpaJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RPAJob'
    },
    evidenceDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GeneratedDocument'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MaintenanceException', maintenanceExceptionSchema);
