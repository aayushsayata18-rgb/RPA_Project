const mongoose = require('mongoose');

const vendorCommunicationSchema = new mongoose.Schema(
  {
    communicationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    vendorId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    communicationType: {
      type: String,
      enum: [
        'Email',
        'Portal Message',
        'Phone Log',
        'System Notification',
        'Document Submission',
        'Other'
      ],
      default: 'Portal Message',
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    referenceType: {
      type: String,
      enum: ['PO', 'ISSUE', 'CONTRACT', 'DOCUMENT', 'GENERAL', 'REGISTRATION'],
      default: 'GENERAL',
      index: true
    },
    referenceId: {
      type: String,
      default: null,
      index: true
    },
    direction: {
      type: String,
      enum: ['INBOUND', 'OUTBOUND'],
      default: 'OUTBOUND',
      index: true
    },
    sender: {
      type: String,
      required: true
    },
    recipient: {
      type: String,
      required: true
    },
    messageReference: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ['SENT', 'DELIVERED', 'READ', 'FAILED'],
      default: 'SENT',
      index: true
    }
  },
  {
    timestamps: true
  }
);

vendorCommunicationSchema.index({ vendorId: 1, timestamp: -1 });

module.exports = mongoose.model('VendorCommunication', vendorCommunicationSchema);
