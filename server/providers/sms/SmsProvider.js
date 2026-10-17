const crypto = require('crypto');

/**
 * SMS Provider Abstraction Interface
 * Implements provider decoupling as specified in 26_NOTIFICATION_SERVICE.md Section 16 & 19
 */
class SmsProvider {
  constructor(name = 'MOCK_SMS_GATEWAY', config = {}) {
    this.name = name;
    this.config = config;
    this.webhookSecret = process.env.SMS_WEBHOOK_SECRET || 'sms-default-secret-token-key-2026';
  }

  /**
   * Send SMS to destination phone
   * @param {Object} params { to, message, senderId, correlationId, notificationId }
   * @returns {Promise<{ success: boolean, providerMessageId: string, status: string, error?: string, raw?: any }>}
   */
  async send({ to, message, senderId = 'HOSPITAL', correlationId = null, notificationId = null }) {
    throw new Error('SmsProvider.send() must be implemented by concrete subclass');
  }

  /**
   * Query status from provider API for status reconciliation
   * @param {string} providerMessageId
   * @returns {Promise<{ status: string, deliveredAt?: Date, errorCode?: string }>}
   */
  async getDeliveryStatus(providerMessageId) {
    throw new Error('SmsProvider.getDeliveryStatus() must be implemented by concrete subclass');
  }

  /**
   * Validate webhook signature from provider
   * @param {Object} payload
   * @param {string} signature
   * @returns {boolean}
   */
  validateWebhookSignature(payload, signature) {
    if (!signature) return false;
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const expected = hmac.update(typeof payload === 'string' ? payload : JSON.stringify(payload)).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}

class MockSmsProvider extends SmsProvider {
  constructor(config = {}) {
    super('MOCK_SMS_GATEWAY', config);
    // In-memory registry for mock status reconciliation and webhook verification
    this.simulatedStore = new Map();
  }

  async send({ to, message, senderId = 'HOSPITAL', correlationId = null, notificationId = null }) {
    // 1. Validate destination
    if (!to || typeof to !== 'string' || to.replace(/\D/g, '').length < 8) {
      return {
        success: false,
        providerMessageId: null,
        status: 'FAILED',
        error: 'INVALID_PHONE',
        raw: { reason: 'Recipient phone number is missing or malformed' }
      };
    }

    // Check for simulated failure trigger (e.g. phone containing '0000' or simulated timeout '9999')
    if (to.includes('0000000000') || to.includes('INVALID')) {
      return {
        success: false,
        providerMessageId: null,
        status: 'FAILED',
        error: 'INVALID_PHONE',
        raw: { code: 'ERR_DESTINATION_UNREACHABLE' }
      };
    }

    if (to.includes('TIMEOUT') || to.includes('8888888888')) {
      const pMsgId = `SMS-${Date.now()}-${Math.floor(Math.random() * 900000 + 100000)}`;
      this.simulatedStore.set(pMsgId, {
        status: 'UNKNOWN',
        deliveredAt: null,
        to,
        message
      });
      return {
        success: true,
        providerMessageId: pMsgId,
        status: 'UNKNOWN',
        error: 'PROVIDER_TIMEOUT',
        raw: { message: 'Provider request timed out; awaiting reconciliation' }
      };
    }

    // Standard simulated success: Accepted by Gateway
    const providerMessageId = `SMS-${Date.now()}-${Math.floor(Math.random() * 900000 + 100000)}`;
    const record = {
      providerMessageId,
      to,
      senderId,
      message,
      status: 'PROVIDER_ACCEPTED',
      acceptedAt: new Date(),
      deliveredAt: new Date(Date.now() + 500)
    };

    this.simulatedStore.set(providerMessageId, record);

    console.log(`[MockSmsProvider] Dispatched SMS to ${to} [ID: ${providerMessageId}]: "${message.substring(0, 60)}..."`);

    return {
      success: true,
      providerMessageId,
      status: 'PROVIDER_ACCEPTED',
      raw: record
    };
  }

  async getDeliveryStatus(providerMessageId) {
    if (this.simulatedStore.has(providerMessageId)) {
      const rec = this.simulatedStore.get(providerMessageId);
      // Automatically advance from UNKNOWN/ACCEPTED to DELIVERED upon reconciliation
      rec.status = 'DELIVERED';
      rec.deliveredAt = rec.deliveredAt || new Date();
      return {
        status: 'DELIVERED',
        deliveredAt: rec.deliveredAt,
        providerMessageId
      };
    }

    // Default reconciliation for any generated test mock ID
    return {
      status: 'DELIVERED',
      deliveredAt: new Date(),
      providerMessageId
    };
  }

  generateSignature(payload) {
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    return hmac.update(typeof payload === 'string' ? payload : JSON.stringify(payload)).digest('hex');
  }
}

// Provider Registry singleton
let currentSmsProvider = new MockSmsProvider();

module.exports = {
  SmsProvider,
  MockSmsProvider,
  getSmsProvider: () => currentSmsProvider,
  setSmsProvider: (provider) => {
    currentSmsProvider = provider;
  }
};
