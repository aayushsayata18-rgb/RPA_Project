const mongoose = require('mongoose');

const AccommodationCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    categoryType: {
      type: String,
      enum: ['GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'ICU', 'HDU', 'ISOLATION', 'EMERGENCY', 'DAY_CARE', 'OTHER'],
      default: 'GENERAL',
      index: true
    },
    baseRateReference: {
      type: Number,
      required: true,
      default: 1000
    },
    patientSelectable: {
      type: Boolean,
      default: true
    },
    clinicallyRestricted: {
      type: Boolean,
      default: false
    },
    sortOrder: {
      type: Number,
      default: 0
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

module.exports = mongoose.model('AccommodationCategory', AccommodationCategorySchema);
