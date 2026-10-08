const mongoose = require('mongoose');

// Dynamic Config Model to avoid hardcoding hospital rules (00_MASTER.md Section 44 & 76)
const hospitalConfigurationSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true, // e.g., 'APPOINTMENT', 'OPD', 'BED', 'BILLING', 'INSURANCE', 'WORKFORCE'
      index: true
    },
    displayName: {
      type: String,
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    valueType: {
      type: String,
      enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY'],
      default: 'STRING'
    },
    description: {
      type: String
    },
    isEditable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('HospitalConfiguration', hospitalConfigurationSchema);
