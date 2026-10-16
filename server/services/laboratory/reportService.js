const LabReport = require('../../models/LabReport');
const LabOrder = require('../../models/LabOrder');
const LabOrderItem = require('../../models/LabOrderItem');
const LabResult = require('../../models/LabResult');
const LabRecord = require('../../models/LabRecord');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

class ReportService {
  /**
   * Generate lab report for an order
   */
  static async generateReport({ orderId, clinicalComments = '', user = null }) {
    const oIdStr = String(orderId || '');
    const order = await LabOrder.findOne({
      $or: [{ orderId: oIdStr }, { _id: oIdStr.match(/^[0-9a-fA-F]{24}$/) ? oIdStr : null }]
    });

    if (!order) {
      throw new Error(`Order '${orderId}' not found.`);
    }

    const orderItems = await LabOrderItem.find({ orderId: order._id }).lean();
    if (!orderItems || orderItems.length === 0) {
      throw new Error(`No tests found in order '${order.orderId}'.`);
    }

    // Fetch all verified or entered results for these items
    const itemIds = orderItems.map(i => i._id);
    const results = await LabResult.find({
      orderItemId: { $in: itemIds }
    }).sort({ createdAt: -1 }).lean();

    // Snapshot results
    const resultsSnapshot = orderItems.map(item => {
      const res = results.find(r => String(r.orderItemId) === String(item._id));
      return {
        orderItemId: item.orderItemId,
        testCode: item.testCodeSnapshot,
        testName: item.testNameSnapshot,
        specimenType: item.specimenTypeSnapshot,
        status: res ? res.status : 'PENDING',
        resultValue: res ? res.resultValue : '',
        resultText: res ? res.resultText : '',
        unit: res ? res.unit : '',
        referenceRange: res ? res.referenceRangeSnapshot : '',
        abnormalFlag: res ? res.abnormalFlag : 'NORMAL',
        parameters: res ? res.parameters : [],
        verifiedBy: res ? res.verifiedByName : '',
        verifiedAt: res ? res.verifiedAt : null
      };
    });

    // Check existing draft report
    let report = await LabReport.findOne({
      orderId: order._id,
      status: { $in: ['DRAFT', 'PENDING_VERIFICATION'] }
    });

    if (!report) {
      const [reportId, reportNumber] = await Promise.all([
        IdGeneratorService.generateLabReportId(),
        IdGeneratorService.generateLabReportNumber()
      ]);

      report = new LabReport({
        reportId,
        reportNumber,
        orderId: order._id,
        orderIdString: order.orderId,
        patientId: order.patientId,
        patientCode: order.patientCode,
        patientName: order.patientName,
        reportVersion: 1,
        status: 'FINALIZED',
        resultsSnapshot,
        clinicalComments,
        verifiedBy: user?._id || null,
        verifiedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Lab Director',
        verifiedAt: new Date()
      });
    } else {
      report.resultsSnapshot = resultsSnapshot;
      report.clinicalComments = clinicalComments || report.clinicalComments;
      report.status = 'FINALIZED';
      report.verifiedBy = user?._id || null;
      report.verifiedByName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : report.verifiedByName;
      report.verifiedAt = new Date();
    }

    await report.save();

    // Link report to order items
    await LabOrderItem.updateMany(
      { orderId: order._id },
      { reportId: report._id, status: 'REPORT_READY' }
    );

    // Update order status
    order.status = 'REPORT_READY';
    await order.save();

    await AuditService.logAction({
      action: 'LAB_REPORT_GENERATED',
      module: 'LABORATORY',
      entityId: report.reportNumber,
      entityType: 'LabReport',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Generated lab report ${report.reportNumber} for order ${order.orderId}`
    });

    return report;
  }

  /**
   * Release a finalized report to patient and doctor portal
   */
  static async releaseReport({ reportIdentifier, user = null }) {
    const rIdStr = String(reportIdentifier || '');
    const report = await LabReport.findOne({
      $or: [
        { reportNumber: rIdStr },
        { reportId: rIdStr },
        { _id: rIdStr.match(/^[0-9a-fA-F]{24}$/) ? rIdStr : null }
      ]
    });

    if (!report) {
      throw new Error(`Laboratory report '${reportIdentifier}' not found.`);
    }

    report.status = 'RELEASED';
    report.releasedBy = user?._id || null;
    report.releasedByName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Pathologist';
    report.releasedAt = new Date();
    await report.save();

    // Update order and order items
    await LabOrder.findByIdAndUpdate(report.orderId, { status: 'RELEASED' });
    await LabOrderItem.updateMany({ orderId: report.orderId }, { status: 'RELEASED' });

    // Sync into Longitudinal Patient Record (Module 7) for completeness
    try {
      const order = await LabOrder.findById(report.orderId);
      for (const snap of (report.resultsSnapshot || [])) {
        await LabRecord.findOneAndUpdate(
          { orderId: `${order.orderId}-${snap.testCode}` },
          {
            orderId: `${order.orderId}-${snap.testCode}`,
            patientId: report.patientCode,
            patientName: report.patientName,
            admissionId: order.admissionIdString || null,
            visitId: order.visitIdString || null,
            testCode: snap.testCode,
            testName: snap.testName,
            orderedByDoctorId: String(order.orderingDoctorId),
            orderedByDoctorName: order.orderingDoctorName,
            orderDate: order.orderDateTime,
            sampleStatus: 'RECEIVED_IN_LAB',
            resultStatus: 'FINAL_VERIFIED',
            reportDate: report.releasedAt,
            verifiedByTechnician: report.verifiedByName,
            results: snap.parameters && snap.parameters.length > 0
              ? snap.parameters.map(p => ({
                  parameter: p.parameterName,
                  value: p.resultValue,
                  unit: p.unit,
                  referenceRange: p.referenceRangeSnapshot,
                  flag: p.abnormalFlag
                }))
              : [
                  {
                    parameter: snap.testName,
                    value: snap.resultValue || snap.resultText,
                    unit: snap.unit,
                    referenceRange: snap.referenceRange,
                    flag: snap.abnormalFlag
                  }
                ]
          },
          { upsert: true, new: true }
        );
      }
    } catch (syncErr) {
      console.warn('[Module 7 LabRecord sync warning]:', syncErr.message);
    }

    // Trigger secure notification (never exposing raw values in plain SMS/email)
    try {
      await NotificationService.sendNotification({
        userId: user?.userId || 'SYSTEM',
        recipient: report.patientCode,
        channel: 'IN_APP',
        templateCode: 'LAB_REPORT_RELEASED',
        variables: {
          reportNumber: report.reportNumber,
          patientName: report.patientName,
          orderId: report.orderIdString,
          portalLink: '/patient/laboratory'
        }
      });
    } catch (notifErr) {
      console.warn('[Notification dispatch warning]:', notifErr.message);
    }

    await AuditService.logAction({
      action: 'LAB_REPORT_RELEASED',
      module: 'LABORATORY',
      entityId: report.reportNumber,
      entityType: 'LabReport',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Released lab report ${report.reportNumber} for patient ${report.patientCode}`
    });

    return report;
  }

  /**
   * Secure report access & download with mandatory audit logging
   */
  static async recordReportDownload({ reportIdentifier, user = null, ipAddress = '' }) {
    const rIdStr = String(reportIdentifier || '');
    const report = await LabReport.findOne({
      $or: [
        { reportNumber: rIdStr },
        { reportId: rIdStr },
        { _id: rIdStr.match(/^[0-9a-fA-F]{24}$/) ? rIdStr : null }
      ]
    });

    if (!report) {
      throw new Error(`Laboratory report '${reportIdentifier}' not found.`);
    }

    // Access control check: If patient, must match patientCode
    if (user?.role === 'PATIENT' && user?.userId !== report.patientCode) {
      throw new Error('Access denied: You are not authorized to download this laboratory report.');
    }

    report.downloadAuditLog.push({
      userId: user?.userId || 'ANONYMOUS',
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User',
      role: user?.role || 'UNKNOWN',
      ipAddress,
      downloadedAt: new Date()
    });

    await report.save();

    await AuditService.logAction({
      action: 'LAB_REPORT_DOWNLOADED',
      module: 'LABORATORY',
      entityId: report.reportNumber,
      entityType: 'LabReport',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Downloaded laboratory report ${report.reportNumber}`,
      metadata: { ipAddress }
    });

    return report;
  }

  static async listReports({ patientCode = '', status = '', search = '', page = 1, limit = 50 }) {
    const filter = {};
    if (patientCode) {
      filter.patientCode = patientCode;
    }
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { reportNumber: { $regex: search, $options: 'i' } },
        { orderIdString: { $regex: search, $options: 'i' } },
        { patientCode: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [reports, total] = await Promise.all([
      LabReport.find(filter)
        .populate('orderId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      LabReport.countDocuments(filter)
    ]);

    return {
      reports,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  static async getReportById(identifier) {
    const idStr = String(identifier || '');
    const report = await LabReport.findOne({
      $or: [
        { reportNumber: idStr },
        { reportId: idStr },
        { _id: idStr.match(/^[0-9a-fA-F]{24}$/) ? idStr : null }
      ]
    })
      .populate('orderId')
      .populate('previousReportId')
      .lean();

    if (!report) {
      throw new Error(`Laboratory report '${identifier}' not found.`);
    }
    return report;
  }
}

module.exports = ReportService;
