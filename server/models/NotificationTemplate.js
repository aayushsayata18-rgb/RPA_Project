const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema(
  {
    templateCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    event: {
      type: String,
      required: true,
      index: true
    },
    channel: {
      type: String,
      enum: ['SMS', 'EMAIL', 'IN_APP', 'ALL'],
      required: true
    },
    subjectTemplate: {
      type: String
    },
    bodyTemplate: {
      type: String,
      required: true
    },
    variables: [
      {
        type: String // e.g. ['patientName', 'appointmentDate', 'tokenNumber']
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
