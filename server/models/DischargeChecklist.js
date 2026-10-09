const mongoose = require('mongoose');

const DischargeChecklistSchema = new mongoose.Schema(
  {
    dischargeId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    dischargeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discharge'
    },
    admissionId: {
      type: String,
      required: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    // Checklist boolean statuses
    clinicalDecisionRecorded: {
      type: Boolean,
      default: false
    },
    patientIdentityVerified: {
      type: Boolean,
      default: false
    },
    admissionVerified: {
      type: Boolean,
      default: false
    },
    pendingLabChecked: {
      type: Boolean,
      default: false
    },
    pendingRadiologyChecked: {
      type: Boolean,
      default: false
    },
    pendingPharmacyChecked: {
      type: Boolean,
      default: false
    },
    otherServicesChecked: {
      type: Boolean,
      default: false
    },
    chargesReconciled: {
      type: Boolean,
      default: false
    },
    finalInvoiceGenerated: {
      type: Boolean,
      default: false
    },
    insuranceChecked: {
      type: Boolean,
      default: false
    },
    paymentSettled: {
      type: Boolean,
      default: false
    },
    documentsGenerated: {
      type: Boolean,
      default: false
    },
    patientNotified: {
      type: Boolean,
      default: false
    },
    bedReleaseRequested: {
      type: Boolean,
      default: false
    },
    housekeepingTriggered: {
      type: Boolean,
      default: false
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    },
    itemLogs: [
      {
        itemKey: String,
        label: String,
        status: {
          type: String,
          enum: ['PENDING', 'PASSED', 'FAILED', 'SKIPPED', 'MANUALLY_OVERRIDDEN'],
          default: 'PENDING'
        },
        performedBy: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        details: String
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DischargeChecklist', DischargeChecklistSchema);
