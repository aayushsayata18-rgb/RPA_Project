const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    inventoryItemId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    itemType: {
      type: String,
      required: true,
      enum: [
        'MEDICINE',
        'SURGICAL_SUPPLY',
        'MEDICAL_CONSUMABLE',
        'LAB_CONSUMABLE',
        'RADIOLOGY_CONSUMABLE',
        'PPE',
        'DISINFECTANT',
        'GENERAL_CLINICAL_SUPPLY',
        'OTHER'
      ],
      default: 'MEDICINE',
      index: true
    },
    medicineId: {
      type: String,
      default: null,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    genericName: {
      type: String,
      trim: true,
      default: ''
    },
    brandName: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    subcategory: {
      type: String,
      trim: true,
      default: ''
    },
    unitOfMeasure: {
      type: String,
      required: true,
      enum: [
        'TABLET',
        'CAPSULE',
        'BOTTLE',
        'VIAL',
        'AMPOULE',
        'BOX',
        'PACK',
        'PIECE',
        'ML',
        'LITRE',
        'GRAM',
        'KILOGRAM',
        'PAIR',
        'ROLL',
        'UNIT'
      ],
      default: 'UNIT'
    },
    packSize: {
      type: Number,
      default: 1,
      min: 1
    },
    packUnit: {
      type: String,
      default: 'BOX'
    },
    baseUnit: {
      type: String,
      default: 'PIECE'
    },
    conversionFactor: {
      type: Number,
      default: 1,
      min: 1
    },
    manufacturer: {
      type: String,
      trim: true,
      default: ''
    },
    supplierReferences: [
      {
        supplierId: { type: String },
        supplierName: { type: String },
        supplierItemCode: { type: String },
        unitPrice: { type: Number, default: 0 }
      }
    ],
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
    reorderLevel: {
      type: Number,
      default: 50,
      min: 0
    },
    reorderQuantity: {
      type: Number,
      default: 100,
      min: 1
    },
    minimumStock: {
      type: Number,
      default: 20,
      min: 0
    },
    maximumStock: {
      type: Number,
      default: 1000,
      min: 1
    },
    prescriptionRequired: {
      type: Boolean,
      default: false
    },
    controlledItem: {
      type: Boolean,
      default: false,
      index: true
    },
    storageRequirements: {
      type: String,
      default: 'Room Temperature (15-25°C)'
    },
    temperatureRequirement: {
      type: String,
      default: 'Ambient' // Ambient, Refrigerated (2-8°C), Frozen (-20°C)
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED', 'PENDING_REVIEW'],
      default: 'ACTIVE',
      index: true
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

inventoryItemSchema.index({ category: 1, status: 1 });
inventoryItemSchema.index({ name: 'text', genericName: 'text', brandName: 'text', sku: 'text' });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
