const crypto = require('crypto');

/**
 * Email Provider Abstraction Interface
 * Implements provider decoupling as specified in 26_NOTIFICATION_SERVICE.md Section 15 & 18
 */
class EmailProvider {
  constructor(name = 'MOCK_EMAIL_TRANSACTIONAL', config = {}) {
    this.name = name;
    this.config = config;
    this.webhookSecret = process.env.EMAIL_WEBHOOK_SECRET || 'email-default-secret-token-key-2026';
  }

  /**
   * Send Email to recipient
   * @param {Object} params { to, subject, body, html, from, correlationId, notificationId }
   * @returns {Promise<{ success: boolean, providerMessageId: string, status: string, error?: string, raw?: any }>}
   */
  async send({ to, subject, body, html = null, from = 'noreply@hospital-platform.local', correlationId = null, notificationId = null }) {
    throw new Error('EmailProvider.send() must be implemented by concrete subclass');
  }

  /**
   * Query status from provider API for status reconciliation
   * @param {string} providerMessageId
   * @returns {Promise<{ status: string, deliveredAt?: Date, bouncedAt?: Date, errorCode?: string }>}
   */
  async getDeliveryStatus(providerMessageId) {
    throw new Error('EmailProvider.getDeliveryStatus() must be implemented by concrete subclass');
  }

  validateWebhookSignature(payload, signature) {
    if (!signature) return false;
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const expected = hmac.update(typeof payload === 'string' ? payload : JSON.stringify(payload)).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}

class MockEmailProvider extends EmailProvider {
  constructor(config = {}) {
    super('MOCK_EMAIL_TRANSACTIONAL', config);
    this.simulatedStore = new Map();
  }

  async send({ to, subject, body, html = null, from = 'noreply@hospital-platform.local', correlationId = null, notificationId = null }) {
    // 1. Validate destination
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!to || !emailRegex.test(to)) {
      return {
        success: false,
        providerMessageId: null,
        status: 'FAILED',
        error: 'INVALID_EMAIL',
        raw: { reason: 'Recipient email address is missing or invalid' }
      };
    }

    if (to.includes('bounce') || to.includes('invalid-user')) {
      return {
        success: false,
        providerMessageId: null,
        status: 'FAILED',
        error: 'PERMANENT_PROVIDER_ERROR',
        raw: { code: 'SMTP_550_USER_UNKNOWN' }
      };
    }

    if (to.includes('timeout') || to.includes('timeout@hospital.com')) {
      const pMsgId = `MAIL-${Date.now()}-${Math.floor(Math.random() * 900000 + 100000)}`;
      this.simulatedStore.set(pMsgId, {
        status: 'UNKNOWN',
        to,
        subject
      });
      return {
        success: true,
        providerMessageId: pMsgId,
        status: 'UNKNOWN',
        error: 'PROVIDER_TIMEOUT',
        raw: { reason: 'Email gateway timeout' }
      };
    }

    const providerMessageId = `MAIL-${Date.now()}-${Math.floor(Math.random() * 900000 + 100000)}`;
    const record = {
      providerMessageId,
      to,
      subject,
      from,
      body,
      status: 'PROVIDER_ACCEPTED',
      acceptedAt: new Date(),
      deliveredAt: new Date(Date.now() + 600)
    };

    this.simulatedStore.set(providerMessageId, record);

    console.log(`[MockEmailProvider] Dispatched Email to ${to} [ID: ${providerMessageId}] Subject: "${subject}"`);

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
      rec.status = 'DELIVERED';
      rec.deliveredAt = rec.deliveredAt || new Date();
      return {
        status: 'DELIVERED',
        deliveredAt: rec.deliveredAt,
        providerMessageId
      };
    }

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

// Singleton email provider
let currentEmailProvider = new MockEmailProvider();

module.exports = {
  EmailProvider,
  MockEmailProvider,
  getEmailProvider: () => currentEmailProvider,
  setEmailProvider: (provider) => {
    currentEmailProvider = provider;
  }
};
