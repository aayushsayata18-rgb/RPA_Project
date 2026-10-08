const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    roleCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    portal: {
      type: String,
      enum: ['PATIENT_PORTAL', 'CLINICAL_PORTAL', 'OPERATIONS_PORTAL', 'FINANCE_PORTAL', 'ADMIN_PORTAL'],
      required: true
    },
    permissions: [
      {
        type: String,
        required: true
      }
    ],
    isSystemDefault: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Role', roleSchema);
