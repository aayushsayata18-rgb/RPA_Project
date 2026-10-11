const mongoose = require('mongoose');

const qualificationSchema = new mongoose.Schema(
  {
    qualification: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      default: '',
      trim: true
    },
    year: {
      type: Number,
      default: null
    },
    verificationStatus: {
      type: String,
      enum: ['NOT_VERIFIED', 'PENDING_VERIFICATION', 'VERIFIED'],
      default: 'NOT_VERIFIED'
    },
    documentUrl: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const specializationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    primary: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const registrationDetailSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      trim: true
    },
    registrationAuthority: {
      type: String,
      required: true,
      trim: true
    },
    issueDate: {
      type: Date,
      default: null
    },
    expiryDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['VALID', 'EXPIRING_SOON', 'EXPIRED', 'PENDING_VERIFICATION', 'NOT_VERIFIED'],
      default: 'VALID'
    },
    documentUrl: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const departmentAssignmentSchema = new mongoose.Schema(
  {
    departmentId: {
      type: String,
      required: true
    },
    departmentName: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRANSFERRED', 'ENDED'],
      default: 'ACTIVE'
    }
  },
  { _id: true }
);

const documentAttachmentSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GeneratedDocument',
      default: null
    },
    documentType: {
      type: String,
      enum: [
        'REGISTRATION_CERTIFICATE',
        'QUALIFICATION_CERTIFICATE',
        'IDENTITY_DOCUMENT',
        'EMPLOYMENT_DOCUMENT',
        'OTHER'
      ],
      default: 'OTHER'
    },
    title: {
      type: String,
      default: ''
    },
    documentUrl: {
      type: String,
      default: ''
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const doctorSchema = new mongoose.Schema(
  {
    doctorId: {
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
      default: null
    },
    employeeId: {
      type: String,
      default: null,
      trim: true
    },
    title: {
      type: String,
      default: 'Dr.',
      trim: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    middleName: {
      type: String,
      default: '',
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    displayName: {
      type: String,
      default: '',
      trim: true
    },
    // Backward compatibility for existing modules:
    fullName: {
      type: String,
      default: '',
      trim: true
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
      default: 'PREFER_NOT_TO_SAY'
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    // Backward compatibility:
    contactNumber: {
      type: String,
      default: '',
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    alternatePhone: {
      type: String,
      default: '',
      trim: true
    },
    profilePhoto: {
      type: String,
      default: ''
    },

    qualifications: {
      type: [qualificationSchema],
      default: []
    },

    specializations: {
      type: [specializationSchema],
      default: []
    },
    // Backward compatibility:
    specialty: {
      type: String,
      default: ''
    },

    registrationDetails: {
      type: [registrationDetailSchema],
      default: []
    },

    departments: {
      type: [departmentAssignmentSchema],
      default: []
    },
    // Backward compatibility:
    departmentId: {
      type: String,
      default: ''
    },
    departmentName: {
      type: String,
      default: ''
    },

    consultationSettings: {
      consultationDurationMinutes: {
        type: Number,
        default: 30
      },
      consultationFee: {
        type: Number,
        default: 500
      },
      currency: {
        type: String,
        default: 'INR'
      }
    },
    // Backward compatibility:
    consultationFee: {
      type: Number,
      default: 500
    },
    slotDurationMinutes: {
      type: Number,
      default: 30
    },
    maxCapacityPerSlot: {
      type: Number,
      default: 1
    },
    roomNumber: {
      type: String,
      default: 'OPD-101'
    },
    experienceYears: {
      type: Number,
      default: 0
    },
    bio: {
      type: String,
      default: ''
    },

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
      default: 'ACTIVE'
    },

    joiningDate: {
      type: Date,
      default: Date.now
    },
    leavingDate: {
      type: Date,
      default: null
    },

    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'VISITING', 'CONSULTANT', 'RESIDENT'],
      default: 'FULL_TIME'
    },

    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'ON_LEAVE', 'SUSPENDED'],
      default: 'AVAILABLE'
    },

    documents: {
      type: [documentAttachmentSchema],
      default: []
    },

    notes: {
      type: String,
      default: ''
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

// Pre-save hook to synchronize display names, primary department and specialty
doctorSchema.pre('save', function (next) {
  if (!this.displayName) {
    this.displayName = `${this.title ? this.title + ' ' : ''}${this.firstName} ${this.lastName}`.trim();
  }
  this.fullName = this.displayName;

  if (!this.contactNumber && this.phone) {
    this.contactNumber = this.phone;
  }
  if (!this.phone && this.contactNumber) {
    this.phone = this.contactNumber;
  }

  if (this.consultationSettings) {
    if (this.consultationSettings.consultationFee !== undefined) {
      this.consultationFee = this.consultationSettings.consultationFee;
    }
    if (this.consultationSettings.consultationDurationMinutes !== undefined) {
      this.slotDurationMinutes = this.consultationSettings.consultationDurationMinutes;
    }
  }

  // Sync primary department if array exists
  if (this.departments && this.departments.length > 0) {
    const primaryDept = this.departments.find((d) => d.isPrimary && d.status === 'ACTIVE') || this.departments[0];
    if (primaryDept) {
      this.departmentId = primaryDept.departmentId;
      this.departmentName = primaryDept.departmentName || this.departmentName;
    }
  }

  // Sync primary specialization if array exists
  if (this.specializations && this.specializations.length > 0) {
    const primarySpec = this.specializations.find((s) => s.primary) || this.specializations[0];
    if (primarySpec) {
      this.specialty = primarySpec.name;
    }
  }

  next();
});

// Indexes for high performance
doctorSchema.index({ displayName: 1 });
doctorSchema.index({ status: 1 });
doctorSchema.index({ 'departments.departmentId': 1 });
doctorSchema.index({ 'specializations.name': 1 });
doctorSchema.index({ 'registrationDetails.registrationNumber': 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
