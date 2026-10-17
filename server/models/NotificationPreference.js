const mongoose = require('mongoose');

// User & Patient Notification Preferences Model (26_NOTIFICATION_SERVICE.md Section 27)
const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true,
      default: null
    },
    patientId: {
      type: String,
      index: true,
      default: null
    },
    employeeId: {
      type: String,
      index: true,
      default: null
    },
    notificationType: {
      type: String,
      required: true,
      index: true
    },
    smsEnabled: {
      type: Boolean,
      default: true
    },
    emailEnabled: {
      type: Boolean,
      default: true
    },
    inAppEnabled: {
      type: Boolean,
      default: true
    },
    quietHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      start: {
        type: String,
        default: '22:00'
      },
      end: {
        type: String,
        default: '07:00'
      }
    }
  },
  {
    timestamps: true
  }
);

notificationPreferenceSchema.index({ userId: 1, notificationType: 1 }, { unique: true, sparse: true });
notificationPreferenceSchema.index({ patientId: 1, notificationType: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
