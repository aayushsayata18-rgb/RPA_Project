require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const NotificationDelivery = require('../models/NotificationDelivery');
const NotificationTemplate = require('../models/NotificationTemplate');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationCampaign = require('../models/NotificationCampaign');
const InAppNotification = require('../models/InAppNotification');

const seedNotifications = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('[Seed Notifications] Connected to MongoDB.');

    // 1. Seed Notification Preferences
    console.log('[Seed Notifications] Seeding default preferences...');
    const defaultPreferences = [
      {
        patientId: 'P10001',
        notificationType: 'APPOINTMENT_REMINDER',
        smsEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
        quietHours: { enabled: true, start: '22:00', end: '07:00' }
      },
      {
        patientId: 'P10001',
        notificationType: 'PROMOTIONAL',
        smsEnabled: false,
        emailEnabled: false,
        inAppEnabled: false,
        quietHours: { enabled: false, start: '22:00', end: '07:00' }
      },
      {
        employeeId: 'E10001',
        notificationType: 'LEAVE_SUBMITTED',
        smsEnabled: false,
        emailEnabled: true,
        inAppEnabled: true,
        quietHours: { enabled: false, start: '22:00', end: '07:00' }
      }
    ];

    for (const pref of defaultPreferences) {
      const filter = pref.patientId
        ? { patientId: pref.patientId, notificationType: pref.notificationType }
        : { employeeId: pref.employeeId, notificationType: pref.notificationType };

      await NotificationPreference.findOneAndUpdate(filter, pref, { upsert: true, new: true });
    }

    // 2. Seed Sample Notifications covering all lifecycle states (Section 112)
    console.log('[Seed Notifications] Seeding sample notifications across lifecycle statuses...');
    const sampleNotifications = [
      {
        notificationId: 'NTF-2026-000001',
        type: 'APPOINTMENT_CONFIRMATION',
        event: 'APPOINTMENT_CONFIRMATION',
        recipient: {
          patientId: 'P10001',
          name: 'Rahul Shah',
          phone: '+919876543210',
          email: 'rahul.shah@example.com'
        },
        channels: ['SMS', 'EMAIL', 'IN_APP'],
        channel: 'SMS',
        templateCode: 'APPOINTMENT_CONFIRMATION',
        subject: 'Appointment Confirmed - Dr. Patel',
        body: 'Dear Rahul Shah, your appointment with Dr. Patel is confirmed for 2026-10-25 at 10:30 AM. Appointment ID: APT-2026-1001.',
        priority: 'NORMAL',
        status: 'DELIVERED',
        sentAt: new Date(Date.now() - 3600000),
        deliveredAt: new Date(Date.now() - 3590000),
        reference: { entityType: 'Appointment', entityId: 'APT-2026-1001' }
      },
      {
        notificationId: 'NTF-2026-000002',
        type: 'PAYMENT_SUCCESS',
        event: 'PAYMENT_SUCCESS',
        recipient: {
          patientId: 'P10001',
          name: 'Rahul Shah',
          phone: '+919876543210',
          email: 'rahul.shah@example.com'
        },
        channels: ['SMS', 'EMAIL', 'IN_APP'],
        channel: 'EMAIL',
        templateCode: 'PAYMENT_SUCCESS',
        subject: 'Payment Receipt: ₹12,500 Received - TXN-2026-8801',
        body: 'Dear Rahul Shah, payment of ₹12,500 has been successfully processed for Transaction ID: TXN-2026-8801.',
        priority: 'HIGH',
        status: 'DELIVERED',
        sentAt: new Date(Date.now() - 7200000),
        deliveredAt: new Date(Date.now() - 7190000),
        idempotencyKey: 'PAYMENT_SUCCESS:TXN-2026-8801',
        reference: { entityType: 'Payment', entityId: 'TXN-2026-8801' }
      },
      {
        notificationId: 'NTF-2026-000003',
        type: 'APPOINTMENT_REMINDER_SMS',
        event: 'APPOINTMENT_REMINDER_SMS',
        recipient: {
          patientId: 'P10002',
          name: 'Priya Mehta',
          phone: '+919123456780',
          email: 'priya.mehta@example.com'
        },
        channels: ['SMS'],
        channel: 'SMS',
        templateCode: 'APPOINTMENT_REMINDER_SMS',
        subject: 'Upcoming Appointment Reminder',
        body: 'Reminder: Hello Priya Mehta, you have an upcoming appointment with Dr. Mehta tomorrow at 11:00 AM.',
        priority: 'NORMAL',
        status: 'SCHEDULED',
        scheduledAt: new Date(Date.now() + 86400000),
        reference: { entityType: 'Appointment', entityId: 'APT-2026-1002' }
      },
      {
        notificationId: 'NTF-2026-000004',
        type: 'LAB_REPORT_RELEASED',
        event: 'LAB_REPORT_RELEASED',
        recipient: {
          patientId: 'P10001',
          name: 'Rahul Shah',
          phone: '+910000000000',
          email: 'rahul.shah@example.com'
        },
        channels: ['SMS', 'IN_APP'],
        channel: 'SMS',
        templateCode: 'LAB_REPORT_RELEASED',
        subject: 'Diagnostic Lab Report Released - LAB-ORD-2026-01',
        body: 'Dear Rahul Shah, your test results for Complete Blood Count are now ready. Please log in to your secure patient portal to view the certified report.',
        priority: 'NORMAL',
        status: 'PARTIALLY_DELIVERED',
        failureReason: 'SMS provider rejected phone number',
        sentAt: new Date(Date.now() - 1800000),
        reference: { entityType: 'LabOrder', entityId: 'LAB-ORD-2026-01' }
      },
      {
        notificationId: 'NTF-2026-000005',
        type: 'FEEDBACK_RESPONSE_AVAILABLE',
        event: 'FEEDBACK_RESPONSE_AVAILABLE',
        recipient: {
          patientId: 'P10003',
          name: 'Amit Patel',
          phone: '+918888888888',
          email: 'amit.timeout@hospital.com'
        },
        channels: ['SMS'],
        channel: 'SMS',
        templateCode: 'FEEDBACK_RESPONSE_AVAILABLE',
        subject: 'Official Response to Case FB-2026-000001',
        body: 'Dear Amit Patel, an official response has been published regarding your feedback case FB-2026-000001.',
        priority: 'NORMAL',
        status: 'UNKNOWN',
        sentAt: new Date(Date.now() - 900000),
        reference: { entityType: 'Feedback', entityId: 'FB-2026-000001' }
      },
      {
        notificationId: 'NTF-2026-000006',
        type: 'RPA_JOB_FAILED',
        event: 'RPA_JOB_FAILED',
        recipient: {
          name: 'Operations Team',
          email: 'admin@hospital.local'
        },
        channels: ['EMAIL', 'IN_APP'],
        channel: 'EMAIL',
        templateCode: 'RPA_JOB_FAILED',
        subject: 'ALERT: RPA Execution Failed - RPA-SYNC-01',
        body: 'System alert: RPA Job RPA-SYNC-01 execution failed. Exception: Remote gateway connection reset. Review RPA operations console.',
        priority: 'CRITICAL',
        status: 'FAILED',
        failureReason: 'SMTP server temporary connection refused',
        retryCount: 3,
        sentAt: new Date(Date.now() - 4000000),
        reference: { entityType: 'RPAJob', entityId: 'RPA-SYNC-01' }
      }
    ];

    for (const notifData of sampleNotifications) {
      const notifDoc = await Notification.findOneAndUpdate(
        { notificationId: notifData.notificationId },
        notifData,
        { upsert: true, new: true }
      );

      // Seed child delivery attempts
      if (notifData.status === 'DELIVERED') {
        await NotificationDelivery.findOneAndUpdate(
          { deliveryId: `DLV-${notifData.notificationId.replace('NTF-', '')}-01` },
          {
            deliveryId: `DLV-${notifData.notificationId.replace('NTF-', '')}-01`,
            notificationId: notifDoc._id,
            notificationCode: notifDoc.notificationId,
            channel: notifDoc.channels[0] || 'SMS',
            provider: 'MOCK_SMS_GATEWAY',
            status: 'DELIVERED',
            attemptNumber: 1,
            providerMessageId: `SMS-${Date.now()}-101`,
            requestedAt: notifDoc.sentAt,
            acceptedAt: notifDoc.sentAt,
            deliveredAt: notifDoc.deliveredAt
          },
          { upsert: true, new: true }
        );
      } else if (notifData.status === 'UNKNOWN') {
        await NotificationDelivery.findOneAndUpdate(
          { deliveryId: `DLV-${notifData.notificationId.replace('NTF-', '')}-01` },
          {
            deliveryId: `DLV-${notifData.notificationId.replace('NTF-', '')}-01`,
            notificationId: notifDoc._id,
            notificationCode: notifDoc.notificationId,
            channel: 'SMS',
            provider: 'MOCK_SMS_GATEWAY',
            status: 'UNKNOWN',
            attemptNumber: 1,
            providerMessageId: `SMS-TIMEOUT-99999`,
            requestedAt: notifDoc.sentAt
          },
          { upsert: true, new: true }
        );
      }

      // Seed In-App notification records
      if (notifDoc.channels.includes('IN_APP')) {
        await InAppNotification.findOneAndUpdate(
          { notificationId: notifDoc.notificationId },
          {
            notificationId: notifDoc.notificationId,
            recipientPatientId: notifDoc.recipient.patientId,
            recipientUserId: 'GLOBAL',
            title: notifDoc.subject,
            message: notifDoc.body,
            type: notifDoc.type,
            priority: notifDoc.priority,
            reference: notifDoc.reference,
            isRead: false
          },
          { upsert: true, new: true }
        );
      }
    }

    // 3. Seed Sample Bulk Campaign (Section 63)
    console.log('[Seed Notifications] Seeding sample bulk campaign...');
    await NotificationCampaign.findOneAndUpdate(
      { campaignId: 'CMP-2026-000001' },
      {
        campaignId: 'CMP-2026-000001',
        name: 'Annual Free Health Checkup Camp Announcement',
        type: 'COMMUNITY_ANNOUNCEMENT',
        audienceDefinition: {
          targetGroup: 'ALL_PATIENTS'
        },
        recipientCount: 150,
        customSubject: 'Invitation: Free Annual Health Checkup Camp',
        customBody: 'Dear Patient, MediSync Hospital is pleased to invite you to our complimentary comprehensive health checkup camp this Saturday from 9 AM to 4 PM.',
        channels: ['SMS', 'IN_APP'],
        status: 'APPROVED',
        approvalRequired: true,
        approvedBy: 'admin@hospital.local',
        approvedAt: new Date(),
        deliveryStats: {
          total: 150,
          delivered: 146,
          failed: 4,
          pending: 0
        }
      },
      { upsert: true, new: true }
    );

    console.log('[Seed Notifications] Module 26 seed data completed successfully.');
    if (require.main === module) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Notifications Error]:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedNotifications();
}

module.exports = seedNotifications;
