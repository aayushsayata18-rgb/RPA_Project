const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    genericName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    brandName: {
      type: String,
      trim: true,
      index: true
    },
    strength: {
      type: String,
      required: true,
      trim: true
    },
    dosageForm: {
      type: String,
      required: true,
      trim: true,
      index: true // Tablet, Capsule, Syrup, Injection, Cream, Drops, Inhaler, etc.
    },
    unit: {
      type: String,
      required: true,
      default: 'Tablet' // Tablet, Capsule, Bottle, Vial, Tube
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    manufacturer: {
      type: String,
      trim: true,
      index: true
    },
    category: {
      type: String,
      trim: true,
      index: true // Analgesic, Antibiotic, Antacid, Antihistamine, etc.
    },
    barcode: {
      type: String,
      trim: true,
      index: true,
      sparse: true
    },
    sku: {
      type: String,
      trim: true,
      index: true,
      sparse: true
    },
    prescriptionRequired: {
      type: Boolean,
      default: true
    },
    controlledMedicine: {
      type: Boolean,
      default: false,
      index: true
    },
    storageRequirements: {
      type: String,
      default: 'Room Temperature' // Room Temperature, Refrigerated (2-8°C), Cool & Dry
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED', 'PENDING_REVIEW'],
      default: 'ACTIVE',
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    reorderLevel: {
      type: Number,
      default: 100
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    },
    updatedBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

medicineSchema.index({ genericName: 1, strength: 1, dosageForm: 1, manufacturer: 1 });
medicineSchema.index({ status: 1, controlledMedicine: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
