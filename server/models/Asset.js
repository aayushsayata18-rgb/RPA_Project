const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    assetTag: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetCategory',
      index: true
    },
    subcategory: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    manufacturer: {
      type: String,
      trim: true
    },
    model: {
      type: String,
      trim: true
    },
    serialNumber: {
      type: String,
      trim: true,
      index: true
    },
    purchaseDate: {
      type: Date
    },
    installationDate: {
      type: Date
    },
    warrantyStartDate: {
      type: Date
    },
    warrantyEndDate: {
      type: Date
    },
    warrantyProvider: {
      type: String,
      trim: true
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
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    status: {
      type: String,
      enum: [
        'ACTIVE',
        'IN_USE',
        'AVAILABLE',
        'UNDER_MAINTENANCE',
        'OUT_OF_SERVICE',
        'QUARANTINED',
        'RETIRED',
        'DISPOSED',
        'LOST',
        'PENDING_INSPECTION'
      ],
      default: 'AVAILABLE',
      index: true
    },
    criticality: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    maintenanceRequired: {
      type: Boolean,
      default: false
    },
    preventiveMaintenancePlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PreventiveMaintenancePlan'
    },
    externalAssetId: {
      type: String,
      trim: true,
      index: true
    },
    notes: {
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

assetSchema.index({ name: 'text', model: 'text', serialNumber: 'text', assetTag: 'text' });

module.exports = mongoose.model('Asset', assetSchema);
