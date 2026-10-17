const mongoose = require('mongoose');

// Module 28: ReportDefinition Model (28_REPORTS_ANALYTICS.md Section 7)
const reportDefinitionSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      index: true,
      enum: [
        'PATIENT_ADMINISTRATION',
        'APPOINTMENT',
        'OPD',
        'ADMISSION',
        'BED',
        'DISCHARGE',
        'BILLING',
        'PAYMENT',
        'INSURANCE',
        'CLAIMS',
        'DOCTOR',
        'STAFF',
        'ATTENDANCE',
        'SHIFT',
        'LEAVE',
        'PAYROLL',
        'PHARMACY',
        'INVENTORY',
        'PROCUREMENT',
        'VENDOR',
        'LABORATORY',
        'RADIOLOGY',
        'MAINTENANCE',
        'HOUSEKEEPING',
        'FEEDBACK',
        'NOTIFICATION',
        'DOCUMENT',
        'RPA',
        'EXCEPTION',
        'MANAGEMENT'
      ]
    },
    description: {
      type: String,
      trim: true
    },
    sourceModules: [
      {
        type: String
      }
    ],
    dataSource: {
      type: String,
      default: 'MONGO_COLLECTION'
    },
    queryDefinition: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    filters: [
      {
        field: { type: String, required: true },
        label: { type: String },
        type: { type: String, default: 'STRING' }, // DATE, STRING, NUMBER, SELECT, BOOLEAN
        required: { type: Boolean, default: false },
        allowedValues: [{ type: String }],
        defaultValue: { type: mongoose.Schema.Types.Mixed }
      }
    ],
    columns: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        dataType: { type: String, default: 'STRING' }, // STRING, NUMBER, CURRENCY, DATE, PERCENTAGE, BADGE
        visible: { type: Boolean, default: true },
        exportable: { type: Boolean, default: true }
      }
    ],
    permissions: [
      {
        type: String
      }
    ],
    exportFormats: [
      {
        type: String,
        enum: ['CSV', 'JSON', 'PDF', 'XLSX'],
        default: 'CSV'
      }
    ],
    scheduleEnabled: {
      type: Boolean,
      default: true
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    createdBy: {
      type: String,
      default: 'SYSTEM'
    }
  },
  {
    timestamps: true
  }
);

reportDefinitionSchema.index({ category: 1, enabled: 1 });

module.exports = mongoose.model('ReportDefinition', reportDefinitionSchema);
