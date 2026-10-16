const mongoose = require('mongoose');

const radiologyExamSchema = new mongoose.Schema(
  {
    examId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['DIAGNOSTIC_XRAY', 'COMPUTED_TOMOGRAPHY', 'MAGNETIC_RESONANCE', 'ULTRASOUND', 'MAMMOGRAPHY', 'FLUOROSCOPY', 'NUCLEAR_MEDICINE', 'INTERVENTIONAL', 'OTHER'],
      default: 'DIAGNOSTIC_XRAY',
      index: true
    },
    modalityType: {
      type: String,
      enum: ['X_RAY', 'CT', 'MRI', 'ULTRASOUND', 'MAMMOGRAPHY', 'PET_SCAN', 'FLUOROSCOPY', 'DEXA', 'OTHER'],
      required: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    bodyPart: {
      type: String,
      default: ''
    },
    preparationInstructions: {
      type: String,
      default: ''
    },
    fastingRequired: {
      type: Boolean,
      default: false
    },
    appointmentRequired: {
      type: Boolean,
      default: true
    },
    estimatedDurationMinutes: {
      type: Number,
      default: 30
    },
    turnaroundTimeMinutes: {
      type: Number,
      default: 120
    },
    chargeCode: {
      type: String,
      default: ''
    },
    priceReference: {
      type: Number,
      default: 0
    },
    externalCode: {
      type: String,
      default: ''
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'RETIRED'],
      default: 'ACTIVE',
      index: true
    },
    activeFrom: {
      type: Date,
      default: Date.now
    },
    inactiveFrom: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

radiologyExamSchema.index({ modalityType: 1, status: 1 });
radiologyExamSchema.index({ name: 'text', code: 'text', description: 'text' });

module.exports = mongoose.model('RadiologyExam', radiologyExamSchema);
