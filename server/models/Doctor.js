const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    departmentId: {
      type: String,
      required: true,
      ref: 'Department'
    },
    departmentName: {
      type: String,
      required: true
    },
    specialty: {
      type: String,
      required: true
    },
    qualifications: {
      type: [String],
      default: []
    },
    experienceYears: {
      type: Number,
      default: 0
    },
    consultationFee: {
      type: Number,
      default: 500
    },
    roomNumber: {
      type: String,
      default: 'OPD-101'
    },
    contactNumber: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    slotDurationMinutes: {
      type: Number,
      default: 30
    },
    maxCapacityPerSlot: {
      type: Number,
      default: 1
    },
    bio: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_LEAVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

doctorSchema.index({ departmentId: 1, status: 1 });
doctorSchema.index({ specialty: 1, status: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
