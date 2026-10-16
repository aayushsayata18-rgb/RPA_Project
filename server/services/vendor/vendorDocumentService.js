const VendorDocument = require('../../models/VendorDocument');
const Vendor = require('../../models/Vendor');
const AuditEvent = require('../../models/AuditEvent');
const NotificationService = require('../NotificationService');
const IdGeneratorService = require('../IdGeneratorService');

class VendorDocumentService {
  /**
   * Upload / register a vendor document
   */
  static async uploadDocument(vendorId, docData, uploadedBy) {
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) {
      throw new Error(`Vendor ${vendorId} not found`);
    }

    const vendorDocumentId = await IdGeneratorService.generateVendorDocumentId();
    const document = new VendorDocument({
      vendorDocumentId,
      vendorId,
      documentType: docData.documentType,
      documentNumber: docData.documentNumber || '',
      title: docData.title || docData.documentType,
      issueDate: docData.issueDate || null,
      expiryDate: docData.expiryDate || null,
      issuer: docData.issuer || '',
      fileReference: docData.fileReference || '',
      fileName: docData.fileName || '',
      fileSize: docData.fileSize || 0,
      mimeType: docData.mimeType || 'application/pdf',
      status: 'UPLOADED',
      verificationStatus: 'NOT_VERIFIED',
      uploadedBy: uploadedBy || 'SYSTEM',
      notes: docData.notes || ''
    });

    await document.save();

    await AuditEvent.create({
      eventType: 'DOCUMENT_UPLOADED',
      entityId: vendorId,
      entityType: 'VendorDocument',
      userId: uploadedBy || 'SYSTEM',
      description: `Document [${docData.documentType}] uploaded for vendor ${vendor.displayName}`,
      metadata: { vendorDocumentId, documentType: docData.documentType }
    }).catch(() => {});

    return document;
  }

  /**
   * Verify or reject a vendor document
   */
  static async verifyDocument(vendorDocumentId, verificationData, verifiedBy) {
    const { status, notes, rejectionReason } = verificationData; // status: 'VERIFIED' or 'REJECTED'
    const doc = await VendorDocument.findOne({ vendorDocumentId });
    if (!doc) {
      throw new Error(`Document ${vendorDocumentId} not found`);
    }

    doc.status = status;
    doc.verificationStatus = status === 'VERIFIED' ? 'VERIFIED' : 'REJECTED';
    doc.verifiedBy = verifiedBy;
    doc.verifiedAt = new Date();
    if (rejectionReason) doc.rejectionReason = rejectionReason;
    if (notes) doc.notes = notes;

    await doc.save();

    await AuditEvent.create({
      eventType: status === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
      entityId: doc.vendorId,
      entityType: 'VendorDocument',
      userId: verifiedBy || 'SYSTEM',
      description: `Document ${vendorDocumentId} (${doc.documentType}) ${status.toLowerCase()} by ${verifiedBy}`,
      metadata: { vendorDocumentId, status, rejectionReason }
    }).catch(() => {});

    return doc;
  }

  /**
   * Get all documents for a vendor
   */
  static async getVendorDocuments(vendorId) {
    return await VendorDocument.find({ vendorId }).sort({ createdAt: -1 });
  }

  /**
   * Check for expiring or expired documents across all vendors
   * Section 30 & 31: 30, 60, 90 days threshold monitoring
   */
  static async checkExpiringDocuments(warningDays = 30) {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + Number(warningDays));

    // Expired documents
    const expiredDocs = await VendorDocument.find({
      expiryDate: { $lt: now },
      status: { $nin: ['EXPIRED', 'REPLACED', 'CANCELLED'] }
    }).populate({ path: 'vendorId', select: 'displayName email' });

    // Mark as expired in DB
    for (const doc of expiredDocs) {
      doc.status = 'EXPIRED';
      await doc.save();
    }

    // Expiring soon documents
    const expiringSoonDocs = await VendorDocument.find({
      expiryDate: { $gte: now, $lte: thresholdDate },
      status: { $in: ['UPLOADED', 'VERIFIED', 'UNDER_REVIEW'] }
    }).lean();

    const results = [];
    for (const doc of expiringSoonDocs) {
      const vendor = await Vendor.findOne({ vendorId: doc.vendorId }).select('displayName email phone status').lean();
      const diffMs = new Date(doc.expiryDate) - now;
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      results.push({
        document: doc,
        vendor,
        daysRemaining
      });

      // Dispatch alert notification
      try {
        await NotificationService.sendNotification({
          recipientId: 'PROCUREMENT_OFFICER',
          event: 'VENDOR_DOCUMENT_EXPIRING',
          title: `Vendor Document Expiring Soon: ${doc.documentType}`,
          message: `Vendor ${vendor?.displayName || doc.vendorId}'s document '${doc.documentType}' (#${doc.documentNumber}) expires in ${daysRemaining} day(s).`,
          channel: 'IN_APP',
          entityType: 'VendorDocument',
          entityId: doc.vendorDocumentId
        });
      } catch (e) {
        // notification failures should not crash workflow
      }
    }

    return {
      expiredCount: expiredDocs.length,
      expiringSoonCount: results.length,
      warningDays,
      expiringDocuments: results
    };
  }
}

module.exports = VendorDocumentService;
