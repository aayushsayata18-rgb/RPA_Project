const mongoose = require('mongoose');

const departmentAssignmentSchema = new mongoose.Schema(
  {
    departmentId: {
      type: String,
      ref: 'Department',
      required: true
    },
    departmentName: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRANSFERRED', 'ENDED'],
      default: 'ACTIVE'
    }
  },
  { _id: true }
);

const roleAssignmentSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },
    roleCode: {
      type: String,
      required: true,
      trim: true
    },
    roleName: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED', 'SUPERSEDED'],
      default: 'ACTIVE'
    }
  },
  { _id: true }
);

const qualificationSchema = new mongoose.Schema(
  {
    qualification: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      trim: true
    },
    year: {
      type: Number
    }
  },
  { _id: true }
);

const employeeDocumentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true
    },
    documentType: {
      type: String,
      enum: [
        'IDENTITY',
        'ADDRESS',
        'QUALIFICATION',
        'EMPLOYMENT',
        'CONTRACT',
        'APPOINTMENT_LETTER',
        'POLICY_ACKNOWLEDGEMENT',
        'OTHER'
      ],
      default: 'OTHER'
    },
    documentName: {
      type: String,
      trim: true
    },
    documentUrl: {
      type: String
    },
    version: {
      type: Number,
      default: 1
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: String
    }
  },
  { _id: true }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    middleName: {
      type: String,
      trim: true,
      default: ''
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    displayName: {
      type: String,
      trim: true,
      index: true
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
      default: 'PREFER_NOT_TO_SAY'
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    alternatePhone: {
      type: String,
      trim: true
    },
    address: {
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' }
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    employeeType: {
      type: String,
      enum: [
        'NURSE',
        'RECEPTIONIST',
        'PHARMACIST',
        'LAB_TECHNICIAN',
        'RADIOLOGY_TECHNICIAN',
        'HOUSEKEEPING',
        'MAINTENANCE',
        'BILLING',
        'HR',
        'ADMINISTRATION',
        'PROCUREMENT',
        'OTHER'
      ],
      required: true,
      default: 'OTHER'
    },
    employmentType: {
      type: String,
      enum: [
        'FULL_TIME',
        'PART_TIME',
        'CONTRACT',
        'TEMPORARY',
        'CONSULTANT',
        'INTERN',
        'OTHER'
      ],
      required: true,
      default: 'FULL_TIME'
    },
    designation: {
      type: String,
      required: true,
      trim: true
    },
    joiningDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    leavingDate: {
      type: Date
    },
    departmentAssignments: [departmentAssignmentSchema],
    roleAssignments: [roleAssignmentSchema],
    managerId: {
      type: String,
      default: null,
      ref: 'Employee'
    },
    managerName: {
      type: String,
      default: ''
    },
    qualifications: [qualificationSchema],
    employeeDocuments: [employeeDocumentSchema],
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_APPROVAL',
        'ACTIVE',
        'ON_LEAVE',
        'SUSPENDED',
        'INACTIVE',
        'TERMINATED'
      ],
      default: 'PENDING_APPROVAL',
      index: true
    },
    accessProvisioningStatus: {
      type: String,
      enum: [
        'NOT_REQUESTED',
        'REQUESTED',
        'PENDING_APPROVAL',
        'IN_PROGRESS',
        'PROVISIONED',
        'FAILED',
        'REVOKED'
      ],
      default: 'NOT_REQUESTED'
    },
    approvalDetails: {
      submittedAt: Date,
      approvedAt: Date,
      approvedBy: String,
      rejectedAt: Date,
      rejectedBy: String,
      rejectionReason: String,
      comments: String
    },
    suspensionDetails: {
      suspendedAt: Date,
      suspendedBy: String,
      expectedEndDate: Date,
      reason: String,
      notes: String
    },
    terminationDetails: {
      terminatedAt: Date,
      terminatedBy: String,
      reason: String,
      noticePeriodServed: Boolean,
      offboardingChecklist: [
        {
          item: String,
          status: {
            type: String,
            enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
            default: 'PENDING'
          },
          completedAt: Date,
          completedBy: String,
          notes: String
        }
      ]
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

// Indexes
employeeSchema.index({ 'departmentAssignments.departmentId': 1 });
employeeSchema.index({ 'roleAssignments.roleCode': 1 });
employeeSchema.index({ employeeType: 1 });
employeeSchema.index({ employmentType: 1 });

// Helper pre-save for displayName
employeeSchema.pre('save', function (next) {
  if (this.firstName || this.lastName) {
    const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
    this.displayName = parts.join(' ').trim();
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
