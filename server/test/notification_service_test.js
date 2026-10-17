require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const assert = require('assert');
const NotificationService = require('../services/NotificationService');
const TemplateService = require('../services/templateService');
const RetryService = require('../services/retryService');
const PreferenceService = require('../services/preferenceService');
const ReconciliationService = require('../services/reconciliationService');
const IdGeneratorService = require('../services/IdGeneratorService');
const Notification = require('../models/Notification');
const NotificationDelivery = require('../models/NotificationDelivery');
const { getSmsProvider } = require('../providers/sms/SmsProvider');

async function runTests() {
  console.log('--- Starting Notification Service Test Suite (Module 26) ---');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');

  try {
    // 1. Test Concurrency-Safe ID Generation
    console.log('[Test 1] Concurrency-safe NTF-YYYY-NNNNNN generation...');
    const ntfId1 = await IdGeneratorService.generateNotificationId();
    const ntfId2 = await IdGeneratorService.generateNotificationId();
    assert.match(ntfId1, /^NTF-\d{4}-\d{6}$/, 'ntfId1 format invalid');
    assert.match(ntfId2, /^NTF-\d{4}-\d{6}$/, 'ntfId2 format invalid');
    assert.notStrictEqual(ntfId1, ntfId2, 'IDs must be unique');
    console.log(`✓ Passed: Generated ${ntfId1} and ${ntfId2}`);

    // 2. Test Template Variable Validation & Rendering
    console.log('[Test 2] Template variable validation & rendering...');
    const tmpl = await TemplateService.resolveTemplate({ templateCode: 'PAYMENT_SUCCESS' });
    assert(tmpl, 'PAYMENT_SUCCESS template must exist');

    // Should throw if missing variable
    let threwError = false;
    try {
      TemplateService.render(tmpl, { patientName: 'Test Patient' }); // missing amount and transactionId
    } catch (err) {
      threwError = true;
      assert.strictEqual(err.code, 'MISSING_TEMPLATE_VARIABLE');
    }
    assert(threwError, 'Template engine must reject missing required variables');

    // Should succeed with all variables
    const rendered = TemplateService.render(tmpl, {
      patientName: 'Test Patient',
      amount: '5000',
      transactionId: 'TXN-9999'
    });
    assert(rendered.body.includes('5000'), 'Rendered body must contain variable value');
    assert(rendered.body.includes('TXN-9999'), 'Rendered body must contain transaction ID');
    console.log('✓ Passed: Template validation and variable substitution');

    // 3. Test Multi-channel Delivery Dispatch
    console.log('[Test 3] Multi-channel notification creation and dispatch...');
    const notif = await NotificationService.sendNotification({
      type: 'PAYMENT_SUCCESS',
      recipient: {
        patientId: 'P10001',
        phone: '+919876543210',
        email: 'test.patient@hospital.com',
        name: 'Test Patient'
      },
      channels: ['SMS', 'EMAIL', 'IN_APP'],
      templateData: {
        patientName: 'Test Patient',
        amount: '1500',
        transactionId: `TXN-TEST-${Date.now()}`
      }
    });

    assert(notif.notificationId, 'Notification must have notificationId');
    assert.strictEqual(notif.status, 'DELIVERED', 'Status must be DELIVERED');
    const deliveries = await NotificationDelivery.find({ notificationId: notif._id });
    assert(deliveries.length >= 2, 'Delivery records must be created for SMS and EMAIL');
    console.log(`✓ Passed: Dispatched across channels for ${notif.notificationId}`);

    // 4. Test Idempotency Key Deduplication (Section 45 & 49)
    console.log('[Test 4] Idempotency key duplicate suppression...');
    const idempKey = `PAY_IDEMP_${Date.now()}`;
    const firstNotif = await NotificationService.sendNotification({
      type: 'PAYMENT_SUCCESS',
      recipient: { phone: '+919876543210', name: 'Test' },
      channels: ['SMS'],
      templateData: { patientName: 'Test', amount: '500', transactionId: 'TXN-1' },
      idempotencyKey: idempKey
    });

    const secondNotif = await NotificationService.sendNotification({
      type: 'PAYMENT_SUCCESS',
      recipient: { phone: '+919876543210', name: 'Test' },
      channels: ['SMS'],
      templateData: { patientName: 'Test', amount: '500', transactionId: 'TXN-1' },
      idempotencyKey: idempKey
    });

    assert.strictEqual(firstNotif.notificationId, secondNotif.notificationId, 'Duplicate event must return same notification without re-sending');
    console.log('✓ Passed: Idempotency deduplication working');

    // 5. Test Retry Eligibility
    console.log('[Test 5] Retry eligibility checking...');
    assert(RetryService.isRetryable('TIMEOUT'), 'TIMEOUT must be retryable');
    assert(RetryService.isRetryable('RATE_LIMIT'), 'RATE_LIMIT must be retryable');
    assert(!RetryService.isRetryable('INVALID_PHONE'), 'INVALID_PHONE must NOT be retryable');
    assert(!RetryService.isRetryable('USER_OPTED_OUT'), 'USER_OPTED_OUT must NOT be retryable');
    console.log('✓ Passed: Retry eligibility rules verified');

    // 6. Test Webhook Signature & Status Reconciliation
    console.log('[Test 6] Webhook signature and delivery status reconciliation...');
    const smsProvider = getSmsProvider();
    const mockPayload = {
      providerMessageId: deliveries[0].providerMessageId || `SMS-${Date.now()}-99`,
      status: 'DELIVERED'
    };
    const signature = smsProvider.generateSignature(mockPayload);
    const valid = smsProvider.validateWebhookSignature(mockPayload, signature);
    assert(valid, 'Webhook signature validation must succeed');

    const webhookRes = await ReconciliationService.processWebhookCallback('MOCK_SMS_GATEWAY', mockPayload, signature);
    assert(webhookRes.success, 'Webhook processing must succeed');
    console.log('✓ Passed: Webhook verified and processed');

    // 7. Test Scheduled Notification Cancellation
    console.log('[Test 7] Scheduled notification cancellation...');
    const futureDate = new Date(Date.now() + 3600000);
    const scheduledNotif = await NotificationService.sendNotification({
      type: 'APPOINTMENT_REMINDER_SMS',
      recipient: { phone: '+919876543210', name: 'Test' },
      channels: ['SMS'],
      templateData: { patientName: 'Test', doctorName: 'Dr. Patel', appointmentDateTime: 'Tomorrow', appointmentId: 'APT-1', roomNumber: '101' },
      scheduledAt: futureDate
    });

    assert.strictEqual(scheduledNotif.status, 'PENDING');
    const cancelled = await NotificationService.cancelScheduledNotification(scheduledNotif.notificationId, 'Patient cancelled');
    assert.strictEqual(cancelled.status, 'CANCELLED');
    console.log(`✓ Passed: Scheduled notification ${scheduledNotif.notificationId} successfully cancelled`);

    // 8. Test Mandatory Notification Overrides
    console.log('[Test 8] Mandatory notification override evaluation...');
    assert(PreferenceService.isMandatory('PAYMENT_SUCCESS'), 'PAYMENT_SUCCESS must be mandatory');
    assert(PreferenceService.isMandatory('SECURITY_ALERT'), 'SECURITY_ALERT must be mandatory');
    assert(!PreferenceService.isMandatory('PROMOTIONAL'), 'PROMOTIONAL must not be mandatory');
    console.log('✓ Passed: Mandatory overrides evaluated');

    console.log('\n======================================================');
    console.log('ALL NOTIFICATION SERVICE UNIT TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
