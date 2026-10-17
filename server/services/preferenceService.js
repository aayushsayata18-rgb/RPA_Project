const NotificationPreference = require('../models/NotificationPreference');

// Mandatory notifications that override opt-outs and quiet hours (Section 28)
const MANDATORY_NOTIFICATION_TYPES = new Set([
  'SECURITY_ALERT',
  'SYSTEM_ALERT',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'ADMISSION_CONFIRMATION',
  'BED_ASSIGNMENT',
  'DISCHARGE_READY',
  'RPA_JOB_FAILED'
]);

class PreferenceService {
  /**
   * Check if a notification type is mandatory according to hospital policy
   */
  static isMandatory(type) {
    return MANDATORY_NOTIFICATION_TYPES.has(type);
  }

  /**
   * Filter requested channels against user preference and check quiet hours
   * @param {Object} params { userId, patientId, type, requestedChannels, now }
   */
  static async evaluatePreferences({ userId = null, patientId = null, type, requestedChannels = ['IN_APP'] }) {
    const isMandatory = this.isMandatory(type);

    // If mandatory, all requested channels are permitted immediately
    if (isMandatory) {
      return {
        allowedChannels: requestedChannels,
        isQuietHoursActive: false,
        isMandatory: true,
        deferUntil: null
      };
    }

    // Lookup preference for user or patient
    let pref = null;
    if (userId) {
      pref = await NotificationPreference.findOne({ userId: String(userId), notificationType: type }).lean();
    }
    if (!pref && patientId) {
      pref = await NotificationPreference.findOne({ patientId: String(patientId), notificationType: type }).lean();
    }

    let allowedChannels = [...requestedChannels];
    if (pref) {
      allowedChannels = requestedChannels.filter((ch) => {
        if (ch === 'SMS' && pref.smsEnabled === false) return false;
        if (ch === 'EMAIL' && pref.emailEnabled === false) return false;
        if (ch === 'IN_APP' && pref.inAppEnabled === false) return false;
        return true;
      });
    }

    // If all channels disabled by preference, default to IN_APP or none
    if (allowedChannels.length === 0) {
      return {
        allowedChannels: [],
        isQuietHoursActive: false,
        isMandatory: false,
        deferUntil: null,
        suppressedByPreference: true
      };
    }

    // Check Quiet Hours (Section 60)
    let isQuietHoursActive = false;
    let deferUntil = null;

    if (pref && pref.quietHours && pref.quietHours.enabled) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = (pref.quietHours.start || '22:00').split(':').map(Number);
      const [endH, endM] = (pref.quietHours.end || '07:00').split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes > endMinutes) {
        // e.g. 22:00 to 07:00 (spans midnight)
        if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
          isQuietHoursActive = true;
        }
      } else {
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          isQuietHoursActive = true;
        }
      }

      if (isQuietHoursActive) {
        // Schedule next delivery for quiet hours end
        deferUntil = new Date(now);
        deferUntil.setHours(endH, endM, 0, 0);
        if (deferUntil <= now) {
          deferUntil.setDate(deferUntil.getDate() + 1);
        }
      }
    }

    return {
      allowedChannels,
      isQuietHoursActive,
      isMandatory: false,
      deferUntil
    };
  }

  /**
   * Save or update preferences
   */
  static async updatePreferences(filter, updateData) {
    return await NotificationPreference.findOneAndUpdate(
      filter,
      { $set: updateData },
      { upsert: true, new: true }
    );
  }
}

module.exports = PreferenceService;
