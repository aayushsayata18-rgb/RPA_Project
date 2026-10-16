const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema(
  {
    parameterId: {
      type: String,
      default: ''
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    unit: {
      type: String,
      default: ''
    },
    referenceRange: {
      type: String,
      default: ''
    },
    dataType: {
      type: String,
      enum: ['NUMERIC', 'TEXT', 'BOOLEAN', 'OPTIONS'],
      default: 'NUMERIC'
    },
    options: [String]
  },
  { _id: true }
);

const reagentRequirementSchema = new mongoose.Schema(
  {
    inventoryItemId: {
      type: String,
      default: ''
    },
    itemName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    unit: {
      type: String,
      default: 'UNIT'
    }
  },
  { _id: true }
);

const labTestSchema = new mongoose.Schema(
  {
    labTestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'HEMATOLOGY',
        'BIOCHEMISTRY',
        'MICROBIOLOGY',
        'IMMUNOLOGY',
        'SEROLOGY',
        'PATHOLOGY',
        'URINALYSIS',
        'CLINICAL_CHEMISTRY',
        'MOLECULAR_DIAGNOSTICS',
        'OTHER'
      ],
      default: 'HEMATOLOGY',
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    specimenType: {
      type: String,
      required: true,
      enum: [
        'WHOLE_BLOOD',
        'SERUM',
        'PLASMA',
        'URINE',
        'STOOL',
        'SPUTUM',
        'CSF',
        'SWAB',
        'TISSUE',
        'OTHER'
      ],
      default: 'WHOLE_BLOOD'
    },
    containerType: {
      type: String,
      required: true,
      enum: [
        'EDTA_TUBE_LAVENDER',
        'SERUM_SEPARATOR_GOLD',
        'SODIUM_CITRATE_BLUE',
        'STERILE_CONTAINER',
        'HEPARIN_GREEN',
        'FLUORIDE_GREY',
        'RED_TOP_PLAIN',
        'OTHER'
      ],
      default: 'EDTA_TUBE_LAVENDER'
    },
    collectionInstructions: {
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
    turnaroundTimeMinutes: {
      type: Number,
      default: 120
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    externalCode: {
      type: String,
      default: ''
    },
    chargeCode: {
      type: String,
      default: ''
    },
    priceReference: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'RETIRED', 'PENDING_APPROVAL'],
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
    parameters: [parameterSchema],
    reagentsRequired: [reagentRequirementSchema],
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

labTestSchema.index({ code: 1, status: 1 });
labTestSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('LabTest', labTestSchema);
