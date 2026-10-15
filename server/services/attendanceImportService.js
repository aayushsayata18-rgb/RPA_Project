const crypto = require('crypto');
const AttendanceImportBatch = require('../models/AttendanceImportBatch');
const AttendanceService = require('./attendanceService');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');

class AttendanceImportService {
  /**
   * Calculate content hash for idempotency checking (Spec Section 10 & 48)
   */
  static computeFileHash(content) {
    return crypto.createHash('sha256').update(typeof content === 'string' ? content : JSON.stringify(content)).digest('hex');
  }

  /**
   * Process a batch of attendance records from CSV, Excel, or RPA
   */
  static async importRecords({
    records = [],
    source = 'CSV',
    fileName = 'attendance_upload.csv',
    rawContent = null,
    user = null
  }) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('Import failed: records array is empty or invalid.');
    }

    const fileHash = AttendanceImportService.computeFileHash(rawContent || records);

    // Idempotency check: see if identical batch was already successfully imported
    const existingBatch = await AttendanceImportBatch.findOne({
      fileHash,
      status: { $in: ['COMPLETED', 'COMPLETED_WITH_ERRORS'] }
    });

    if (existingBatch) {
      return {
        success: true,
        isIdempotentReplay: true,
        message: `Idempotency match: This file/batch was already imported under Batch ID ${existingBatch.batchId}.`,
        batch: existingBatch
      };
    }

    const batchId = await IdGeneratorService.generateAttendanceBatchId();

    const batch = new AttendanceImportBatch({
      batchId,
      source,
      fileName,
      fileHash,
      uploadedBy: user ? String(user._id || user.userId) : 'SYSTEM',
      uploadedByName: user ? user.name || user.email : 'System RPA / Admin',
      recordCount: records.length,
      startedAt: new Date(),
      status: 'PROCESSING'
    });

    await batch.save();

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errorReport = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 1;
      const empCode = row.employeeId || row.employeeIdCode || row.staffId;

      if (!empCode) {
        errorCount++;
        errorReport.push({
          rowNumber: rowNum,
          employeeIdCode: 'UNKNOWN',
          errorReason: 'Missing Employee ID in record row.'
        });
        continue;
      }

      try {
        // Support both single event format (direction + timestamp) and dual punch format (checkIn + checkOut)
        if (row.checkIn || row.checkInTime) {
          const inTime = row.checkIn || row.checkInTime;
          const resIn = await AttendanceService.processPunchEvent({
            employeeIdCode: empCode,
            eventDateTime: inTime,
            direction: 'IN',
            source: source === 'RPA' ? 'RPA' : 'CSV_IMPORT',
            sourceEventId: row.sourceEventId ? `${row.sourceEventId}-IN` : null,
            deviceId: row.deviceId || 'BATCH_IMPORT',
            importBatchId: batch._id,
            user
          });

          if (resIn.isDuplicate) duplicateCount++;
          else if (!resIn.success) {
            errorCount++;
            errorReport.push({
              rowNumber: rowNum,
              employeeIdCode: empCode,
              errorReason: resIn.message || 'Check-in processing error'
            });
          } else {
            successCount++;
          }
        }

        if (row.checkOut || row.checkOutTime) {
          const outTime = row.checkOut || row.checkOutTime;
          const resOut = await AttendanceService.processPunchEvent({
            employeeIdCode: empCode,
            eventDateTime: outTime,
            direction: 'OUT',
            source: source === 'RPA' ? 'RPA' : 'CSV_IMPORT',
            sourceEventId: row.sourceEventId ? `${row.sourceEventId}-OUT` : null,
            deviceId: row.deviceId || 'BATCH_IMPORT',
            importBatchId: batch._id,
            user
          });

          if (resOut.isDuplicate) duplicateCount++;
          else if (!resOut.success) {
            errorCount++;
            errorReport.push({
              rowNumber: rowNum,
              employeeIdCode: empCode,
              errorReason: resOut.message || 'Check-out processing error'
            });
          }
        }

        // If simple punch event without checkIn/checkOut keys (e.g. biometric stream)
        if (!row.checkIn && !row.checkInTime && !row.checkOut && !row.checkOutTime) {
          const punchTime = row.eventDateTime || row.timestamp || row.date;
          const dir = (row.direction || 'IN').toUpperCase();

          const punchRes = await AttendanceService.processPunchEvent({
            employeeIdCode: empCode,
            eventDateTime: punchTime,
            direction: dir,
            source: source === 'RPA' ? 'RPA' : 'CSV_IMPORT',
            sourceEventId: row.sourceEventId,
            deviceId: row.deviceId || 'BATCH_IMPORT',
            importBatchId: batch._id,
            user
          });

          if (punchRes.isDuplicate) duplicateCount++;
          else if (!punchRes.success) {
            errorCount++;
            errorReport.push({
              rowNumber: rowNum,
              employeeIdCode: empCode,
              errorReason: punchRes.message || 'Punch processing failure'
            });
          } else {
            successCount++;
          }
        }
      } catch (err) {
        errorCount++;
        errorReport.push({
          rowNumber: rowNum,
          employeeIdCode: empCode,
          errorReason: err.message
        });
      }
    }

    batch.processedCount = records.length;
    batch.successCount = successCount;
    batch.duplicateCount = duplicateCount;
    batch.errorCount = errorCount;
    batch.errorReport = errorReport;
    batch.completedAt = new Date();
    batch.status = errorCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';

    await batch.save();

    await AuditService.logEvent({
      action: 'ATTENDANCE_BATCH_IMPORTED',
      module: 'ATTENDANCE',
      entityType: 'AttendanceImportBatch',
      entityId: batch.batchId,
      actorUserId: user ? String(user._id || user.userId) : 'SYSTEM',
      actorRole: user ? user.role : 'HR_MANAGER',
      details: `Batch ${batch.batchId} imported with ${successCount} successes, ${duplicateCount} duplicates, and ${errorCount} errors.`
    });

    return {
      success: true,
      batch
    };
  }

  /**
   * Get historical import batches
   */
  static async getImportBatches(page = 1, limit = 20) {
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [batches, total] = await Promise.all([
      AttendanceImportBatch.find()
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      AttendanceImportBatch.countDocuments()
    ]);

    return {
      success: true,
      batches,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Get single import batch by ID
   */
  static async getImportBatchById(batchId) {
    const batch = await AttendanceImportBatch.findOne({
      $or: [{ batchId }, { _id: batchId.match(/^[0-9a-fA-F]{24}$/) ? batchId : null }]
    }).lean();

    if (!batch) {
      throw new Error(`Import batch ${batchId} not found.`);
    }

    return {
      success: true,
      batch
    };
  }
}

module.exports = AttendanceImportService;
