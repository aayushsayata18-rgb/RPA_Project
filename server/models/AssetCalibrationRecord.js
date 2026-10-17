const mongoose = require('mongoose');

const assetCalibrationRecordSchema = new mongoose.Schema(
  {
    calibrationId: {
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
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: {
      type: String,
      trim: true
    },
    performedByVendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    performedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    result: {
      type: String,
      enum: ['PASS', 'FAIL', 'CONDITIONAL'],
      required: true,
      default: 'PASS'
    },
    certificateNumber: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'SCHEDULED', 'COMPLETED', 'PASSED', 'FAILED', 'EXPIRED'],
      default: 'COMPLETED',
      index: true
    },
    standardsUsed: {
      type: String
    },
    temperature: {
      type: String
    },
    humidity: {
      type: String
    },
    notes: {
      type: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AssetCalibrationRecord', assetCalibrationRecordSchema);
