const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    legalName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    vendorType: {
      type: String,
      enum: [
        'SUPPLIER',
        'SERVICE_PROVIDER',
        'EQUIPMENT_VENDOR',
        'PHARMACEUTICAL_VENDOR',
        'LAB_SUPPLIER',
        'MEDICAL_DEVICE_VENDOR',
        'FACILITY_VENDOR',
        'IT_VENDOR',
        'OTHER'
      ],
      default: 'SUPPLIER',
      index: true
    },
    vendorCategory: [
      {
        type: String,
        trim: true,
        uppercase: true
      }
    ],
    registrationNumber: {
      type: String,
      trim: true,
      index: true
    },
    taxIdentificationNumber: {
      type: String,
      trim: true,
      index: true
    },
    businessRegistrationNumber: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    alternatePhone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    },
    postalCode: {
      type: String,
      trim: true
    },
    primaryContactId: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_VERIFICATION',
        'PENDING_APPROVAL',
        'ACTIVE',
        'ON_HOLD',
        'SUSPENDED',
        'INACTIVE',
        'REJECTED',
        'DEACTIVATED'
      ],
      default: 'DRAFT',
      index: true
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
      index: true
    },
    verificationStatus: {
      type: String,
      enum: [
        'NOT_STARTED',
        'IN_PROGRESS',
        'PASSED',
        'FAILED',
        'PARTIAL',
        'PENDING_HUMAN_REVIEW',
        'EXPIRED'
      ],
      default: 'NOT_STARTED',
      index: true
    },
    preferredVendor: {
      type: Boolean,
      default: false
    },
    externalVendorId: {
      type: String,
      index: true
    },
    sourceSystem: {
      type: String,
      default: 'INTERNAL'
    },
    externalReference: {
      type: String
    },
    holdReason: {
      type: String,
      default: null
    },
    holdStart: {
      type: Date,
      default: null
    },
    expectedResolutionDate: {
      type: Date,
      default: null
    },
    placedBy: {
      type: String,
      default: null
    },
    suspensionReason: {
      type: String,
      default: null
    },
    suspendedAt: {
      type: Date,
      default: null
    },
    suspendedBy: {
      type: String,
      default: null
    },
    deactivationReason: {
      type: String,
      default: null
    },
    deactivatedAt: {
      type: Date,
      default: null
    },
    deactivatedBy: {
      type: String,
      default: null
    },
    approvalDecision: {
      decision: {
        type: String,
        enum: ['APPROVE', 'REJECT', 'RETURN_FOR_CORRECTION']
      },
      decisionReason: String,
      approvedBy: String,
      approvedAt: Date
    },
    rejectionReason: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: ''
    },
    servicesOffered: [
      {
        type: String
      }
    ],
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

// Indexes defined in Section 95 of 20_VENDOR_MANAGEMENT.md
vendorSchema.index({ status: 1, vendorCategory: 1 });
vendorSchema.index({ status: 1, verificationStatus: 1 });
vendorSchema.index({ vendorId: 1, status: 1 });
vendorSchema.index({ legalName: 'text', displayName: 'text', email: 'text' });

module.exports = mongoose.model('Vendor', vendorSchema);
