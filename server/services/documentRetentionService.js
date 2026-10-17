const GeneratedDocument = require('../models/GeneratedDocument');
const storage = require('../storage/storageImplementation');
const NotificationService = require('./NotificationService');
const AuditService = require('./AuditService');

/**
 * Module 27: DocumentRetentionService
 * Background integrity checks, archival lifecycle, and expiration alerting
 * (27_DOCUMENT_GENERATION.md Section 62-66, 99, 100)
 */
class DocumentRetentionService {
  /**
   * Run SHA-256 File Checksum Integrity Check across documents (Section 99)
   */
  static async runIntegrityCheck() {
    const documents = await GeneratedDocument.find({
      'storage.path': { $exists: true, $ne: '' }
    }).limit(100).lean();

    const results = {
      totalChecked: 0,
      passed: 0,
      failed: 0,
      details: []
    };

    for (const doc of documents) {
      results.totalChecked++;
      try {
        const storedPath = doc.storage.path;
        const exists = await storage.exists(storedPath);

        if (!exists) {
          results.failed++;
          results.details.push({
            documentId: doc.documentId,
            status: 'MISSING_FILE',
            expectedPath: storedPath
          });
          continue;
        }

        const downloaded = await storage.download(storedPath);
        if (downloaded.checksum !== doc.storage.checksum) {
          results.failed++;
          results.details.push({
            documentId: doc.documentId,
            status: 'CHECKSUM_MISMATCH',
            expectedChecksum: doc.storage.checksum,
            calculatedChecksum: downloaded.checksum
          });
        } else {
          results.passed++;
        }
      } catch (err) {
        results.failed++;
        results.details.push({
          documentId: doc.documentId,
          status: 'ERROR',
          error: err.message
        });
      }
    }

    await AuditService.logEvent({
      userId: 'SYSTEM',
      action: 'INTEGRITY_CHECK_COMPLETED',
      module: 'DOCUMENTS',
      entityType: 'SystemMaintenance',
      entityId: `CHK-${Date.now()}`,
      details: `Integrity check completed: ${results.passed}/${results.totalChecked} passed, ${results.failed} failed`
    });

    return results;
  }

  /**
   * Run Document Archival Retention Job (Section 100)
   */
  static async runRetentionJob(archiveAfterDays = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - archiveAfterDays);

    const candidates = await GeneratedDocument.find({
      status: 'RELEASED',
      createdAt: { $lte: cutoffDate }
    });

    let archivedCount = 0;
    for (const doc of candidates) {
      doc.status = 'ARCHIVED';
      doc.isArchived = true;
      doc.archivedAt = new Date();
      await doc.save();
      archivedCount++;
    }

    await AuditService.logEvent({
      userId: 'SYSTEM',
      action: 'RETENTION_JOB_EXECUTED',
      module: 'DOCUMENTS',
      entityType: 'SystemMaintenance',
      entityId: `RET-${Date.now()}`,
      details: `Archived ${archivedCount} documents past retention threshold of ${archiveAfterDays} days`
    });

    return { archivedCount };
  }

  /**
   * Detect and alert expiring documents (Section 62, 63, 116)
   */
  static async checkExpiringDocuments() {
    const now = new Date();
    const alertWindow = new Date();
    alertWindow.setDate(now.getDate() + 30); // 30 days notice

    const expiringDocs = await GeneratedDocument.find({
      status: 'RELEASED',
      expiresAt: { $exists: true, $ne: null, $gte: now, $lte: alertWindow }
    }).lean();

    for (const doc of expiringDocs) {
      const daysRemaining = Math.ceil((new Date(doc.expiresAt) - now) / (1000 * 60 * 60 * 24));
      try {
        await NotificationService.sendNotification({
          type: 'DOCUMENT_EXPIRING_ALERT',
          recipient: {
            role: 'STAFF',
            email: 'admin@hospital.local'
          },
          channels: ['IN_APP', 'EMAIL'],
          title: `Document Expiring Soon: ${doc.title}`,
          body: `Document ${doc.documentId} (${doc.title}) is scheduled to expire in ${daysRemaining} days on ${new Date(doc.expiresAt).toLocaleDateString()}.`,
          priority: 'NORMAL',
          entityType: 'GeneratedDocument',
          entityId: doc.documentId,
          module: 'DOCUMENTS'
        });
      } catch (e) {
        // Continue
      }
    }

    return { totalExpiring: expiringDocs.length };
  }
}

module.exports = DocumentRetentionService;
