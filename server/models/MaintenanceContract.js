const mongoose = require('mongoose');

const maintenanceContractSchema = new mongoose.Schema(
  {
    contractId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true
    },
    contractNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    contractType: {
      type: String,
      enum: ['AMC', 'CMC', 'WARRANTY', 'ON_DEMAND', 'AMC_COMPREHENSIVE', 'CMC_COMPREHENSIVE', 'AMC_NON_COMPREHENSIVE'],
      default: 'AMC'
    },
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    coveredAssets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
      }
    ],
    serviceFrequency: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'AS_NEEDED'],
      default: 'QUARTERLY'
    },
    terms: {
      type: String
    },
    cost: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'TERMINATED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true
    },
    renewalReminderDate: {
      type: Date
    },
    contactPerson: {
      name: String,
      phone: String,
      email: String
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

module.exports = mongoose.model('MaintenanceContract', maintenanceContractSchema);
