const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    maintenanceType: {
      type: String,
      enum: ['BIOMEDICAL', 'ELECTRICAL', 'MECHANICAL', 'IT', 'FACILITY', 'PLUMBING', 'HVAC', 'GENERAL'],
      default: 'GENERAL'
    },
    defaultCriticality: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AssetCategory', assetCategorySchema);
