const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    wardId: {
      type: String,
      required: true,
      index: true
    },
    wardRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward'
    },
    wardName: {
      type: String,
      default: ''
    },
    roomType: {
      type: String,
      enum: ['STANDARD', 'DELUXE', 'SUITE', 'ICU_ISOLATION', 'GENERAL_BAY', 'TRAUMA_BAY'],
      default: 'STANDARD'
    },
    accommodationCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccommodationCategory'
    },
    capacity: {
      type: Number,
      default: 1
    },
    genderPolicy: {
      type: String,
      enum: ['ANY', 'MALE_ONLY', 'FEMALE_ONLY', 'SINGLE_OCCUPANCY'],
      default: 'ANY'
    },
    isolationCapability: {
      type: Boolean,
      default: false
    },
    floor: {
      type: String,
      default: ''
    },
    wing: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

RoomSchema.index({ wardId: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', RoomSchema);
