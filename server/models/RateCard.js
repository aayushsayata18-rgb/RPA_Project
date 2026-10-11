const mongoose = require('mongoose');

const RateCardSchema = new mongoose.Schema(
  {
    rateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    serviceCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    serviceName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['ROOM_ACCOMMODATION', 'CONSULTATION', 'LABORATORY', 'PHARMACY', 'RADIOLOGY', 'NURSING', 'PROCEDURE', 'OTHER'],
      required: true,
      index: true
    },
    unit: {
      type: String,
      default: 'PER_SERVICE', // PER_DAY, PER_SERVICE, PER_UNIT, PER_TABLET, etc.
      trim: true
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    taxRate: {
      type: Number,
      default: 0, // e.g. 0.05 for 5% GST or tax
      min: 0,
      max: 1
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
      index: true
    },
    effectiveTo: {
      type: Date,
      default: null,
      index: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

RateCardSchema.index({ serviceCode: 1, effectiveFrom: -1 });

module.exports = mongoose.model('RateCard', RateCardSchema);
