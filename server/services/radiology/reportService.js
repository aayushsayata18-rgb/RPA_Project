const RadiologyReport = require('../../models/RadiologyReport');
const RadiologyStudy = require('../../models/RadiologyStudy');
const RadiologyOrder = require('../../models/RadiologyOrder');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

class ReportService {
  /**
   * Create report draft
   */
  static async createDraftReport({
    studyId,
    clinicalHistory = '',
    technique = '',
    findings,
    impression,
    recommendations = '',
    user
  }) {
    if (!studyId || !findings || !impression) {
      throw new Error('studyId, findings, and impression are required to create a radiology report.');
    }

    const study = await RadiologyStudy.findById(studyId).populate('orderId');
    if (!study) {
      throw new Error('Radiology study not found.');
    }

    // Check if an active unreleased draft already exists
    const existing = await RadiologyReport.findOne({
      studyId: study._id,
      status: { $in: ['DRAFT', 'PENDING_VERIFICATION'] }
    });
    if (existing) {
      return existing;
    }

    const reportId = await IdGeneratorService.generateRadiologyStudyId();
    const reportNumber = await IdGeneratorService.generateRadiologyReportNumber();

    const radiologistName = user ? `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Reporting Radiologist';

    const report = new RadiologyReport({
      reportId,
      reportNumber,
      studyId: study._id,
      orderId: study.orderId?._id || study.orderId,
      patientId: study.patientId,
      patientName: study.patientName,
      radiologistId: user?._id || study.patientId,
      radiologistName,
      clinicalHistory: clinicalHistory || study.orderId?.clinicalNote || '',
      technique: technique || `Standard ${study.modalityType} protocol without contraindication`,
      findings,
      impression,
      recommendations,
      reportText: `EXAMINATION: ${study.examName}\nCLINICAL HISTORY: ${clinicalHistory || 'N/A'}\nTECHNIQUE: ${technique}\n\nFINDINGS:\n${findings}\n\nIMPRESSION:\n${impression}\n\nRECOMMENDATIONS:\n${recommendations || 'None'}`,
      status: 'DRAFT',
      reportVersion: 1
    });

    await report.save();

    // Update order status to REPORT_PENDING
    if (study.orderId) {
      await RadiologyOrder.findByIdAndUpdate(study.orderId, {
        status: 'REPORT_PENDING'
      });
    }

    await AuditService.logAction({
      user,
      action: 'DRAFT_RADIOLOGY_REPORT',
      entity: 'RadiologyReport',
      entityId: report._id,
      description: `Created Draft Report ${report.reportNumber} for Accession ${study.accessionNumber}`
    });

    return report;
  }

  /**
   * Update report draft
   */
  static async updateDraft(id, updateData, user) {
    const report = await RadiologyReport.findOne({
      $or: [{ _id: String(id).match(/^[0-9a-fA-F]{24}$/) ? id : null }, { reportId: id }, { reportNumber: id }]
    });

    if (!report) {
      throw new Error('Report not found.');
    }

    if (report.status === 'RELEASED') {
      throw new Error('Released report cannot be updated directly. Please use the Amendment workflow.');
    }

    if (updateData.clinicalHistory !== undefined) report.clinicalHistory = updateData.clinicalHistory;
    if (updateData.technique !== undefined) report.technique = updateData.technique;
    if (updateData.findings) report.findings = updateData.findings;
    if (updateData.impression) report.impression = updateData.impression;
    if (updateData.recommendations !== undefined) report.recommendations = updateData.recommendations;

    report.reportText = `EXAMINATION\nCLINICAL HISTORY: ${report.clinicalHistory}\nTECHNIQUE: ${report.technique}\n\nFINDINGS:\n${report.findings}\n\nIMPRESSION:\n${report.impression}\n\nRECOMMENDATIONS:\n${report.recommendations || 'None'}`;

    if (updateData.status) {
      report.status = updateData.status;
    }

    await report.save();

    await AuditService.logAction({
      user,
      action: 'UPDATE_REPORT_DRAFT',
      entity: 'RadiologyReport',
      entityId: report._id,
      description: `Updated draft report ${report.reportNumber}`
    });

    return report;
  }

  /**
   * Verify and finalize report by authorized reporting physician
   */
  static async verifyReport(id, user) {
    const report = await RadiologyReport.findOne({
      $or: [{ _id: String(id).match(/^[0-9a-fA-F]{24}$/) ? id : null }, { reportId: id }, { reportNumber: id }]
    });

    if (!report) {
      throw new Error('Report not found.');
    }

    if (report.status === 'RELEASED') {
      throw new Error('Report is already released.');
    }

    report.status = 'FINALIZED';
    report.verifiedBy = user?._id || null;
    report.verifiedByName = user ? `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Consultant Radiologist';
    report.verifiedAt = new Date();

    await report.save();

    // Update study status
    await RadiologyStudy.findByIdAndUpdate(report.studyId, {
      studyStatus: 'REPORTED'
    });

    // Update order status to REPORT_READY
    await RadiologyOrder.findByIdAndUpdate(report.orderId, {
      status: 'REPORT_READY'
    });

    await AuditService.logAction({
      user,
      action: 'VERIFY_RADIOLOGY_REPORT',
      entity: 'RadiologyReport',
      entityId: report._id,
      description: `Verified and finalized report ${report.reportNumber} by ${report.verifiedByName}`
    });

    return report;
  }

  /**
   * Release report to Patient and Doctor portals
   */
  static async releaseReport(id, user) {
    const report = await RadiologyReport.findOne({
      $or: [{ _id: String(id).match(/^[0-9a-fA-F]{24}$/) ? id : null }, { reportId: id }, { reportNumber: id }]
    }).populate('orderId');

    if (!report) {
      throw new Error('Report not found.');
    }

    report.status = 'RELEASED';
    report.releasedBy = user?._id || null;
    report.releasedByName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Radiology Administrator';
    report.releasedAt = new Date();

    await report.save();

    // Update order status to RELEASED
    await RadiologyOrder.findByIdAndUpdate(report.orderId?._id || report.orderId, {
      status: 'RELEASED'
    });

    // Send secure notification to patient
    try {
      await NotificationService.sendNotification({
        userId: user?._id || null,
        recipientType: 'PATIENT',
        channel: 'PORTAL',
        templateCode: 'RADIOLOGY_REPORT_RELEASED',
        variables: {
          patientName: report.patientName,
          reportNumber: report.reportNumber,
          examName: report.orderId?.examNameSnapshot || 'Radiology Examination',
          releasedAt: report.releasedAt.toLocaleString()
        }
      });
    } catch (notifErr) {
      console.warn('[Radiology Report Release Notification Error Isolated]:', notifErr.message);
    }

    await AuditService.logAction({
      user,
      action: 'RELEASE_RADIOLOGY_REPORT',
      entity: 'RadiologyReport',
      entityId: report._id,
      description: `Released report ${report.reportNumber} for patient ${report.patientName}`
    });

    return report;
  }

  /**
   * Amend released report (Preserves version history)
   */
  static async amendReport(
    id,
    {
      amendmentReason,
      clinicalHistory,
      technique,
      findings,
      impression,
      recommendations,
      user
    }
  ) {
    if (!amendmentReason) {
      throw new Error('amendmentReason is mandatory to amend a released radiology report.');
    }

    const originalReport = await RadiologyReport.findOne({
      $or: [{ _id: String(id).match(/^[0-9a-fA-F]{24}$/) ? id : null }, { reportId: id }, { reportNumber: id }]
    });

    if (!originalReport) {
      throw new Error('Original report not found.');
    }

    // Mark previous report as AMENDED
    originalReport.status = 'AMENDED';
    originalReport.isAmended = true;
    await originalReport.save();

    // Create new version
    const newVersionNumber = (originalReport.reportVersion || 1) + 1;
    const reportId = await IdGeneratorService.generateRadiologyStudyId();
    const radiologistName = user ? `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim() : originalReport.radiologistName;

    const amendedReport = new RadiologyReport({
      reportId,
      reportNumber: `${originalReport.reportNumber}-V${newVersionNumber}`,
      studyId: originalReport.studyId,
      orderId: originalReport.orderId,
      patientId: originalReport.patientId,
      patientName: originalReport.patientName,
      radiologistId: user?._id || originalReport.radiologistId,
      radiologistName,
      clinicalHistory: clinicalHistory !== undefined ? clinicalHistory : originalReport.clinicalHistory,
      technique: technique !== undefined ? technique : originalReport.technique,
      findings: findings || originalReport.findings,
      impression: impression || originalReport.impression,
      recommendations: recommendations !== undefined ? recommendations : originalReport.recommendations,
      reportText: `[AMENDED REPORT - VERSION ${newVersionNumber}]\nPREVIOUS REPORT REF: ${originalReport.reportNumber}\nAMENDMENT REASON: ${amendmentReason}\n\nFINDINGS:\n${findings || originalReport.findings}\n\nIMPRESSION:\n${impression || originalReport.impression}`,
      status: 'RELEASED',
      reportVersion: newVersionNumber,
      previousReportId: originalReport._id,
      amendmentReason,
      verifiedBy: user?._id || null,
      verifiedByName: radiologistName,
      verifiedAt: new Date(),
      releasedBy: user?._id || null,
      releasedByName: radiologistName,
      releasedAt: new Date(),
      isAmended: true
    });

    await amendedReport.save();

    // Send Amendment Notification
    try {
      await NotificationService.sendNotification({
        userId: user?._id || null,
        recipientType: 'PATIENT',
        channel: 'PORTAL',
        templateCode: 'RADIOLOGY_REPORT_AMENDED',
        variables: {
          patientName: amendedReport.patientName,
          reportNumber: amendedReport.reportNumber,
          amendmentReason
        }
      });
    } catch (notifErr) {
      console.warn('[Radiology Report Amendment Notification Error Isolated]:', notifErr.message);
    }

    await AuditService.logAction({
      user,
      action: 'AMEND_RADIOLOGY_REPORT',
      entity: 'RadiologyReport',
      entityId: amendedReport._id,
      description: `Created amended report ${amendedReport.reportNumber} (Version ${newVersionNumber}). Reason: ${amendmentReason}`
    });

    return amendedReport;
  }

  /**
   * List reports
   */
  static async listReports(filters = {}, pagination = {}) {
    const query = {};

    if (filters.status) query.status = filters.status;
    if (filters.patientId) query.patientId = filters.patientId;
    if (filters.studyId) query.studyId = filters.studyId;
    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [{ reportNumber: regex }, { patientName: regex }, { radiologistName: regex }, { impression: regex }];
    }

    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      RadiologyReport.find(query)
        .populate('studyId')
        .populate('orderId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RadiologyReport.countDocuments(query)
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get report by ID with secure access logging
   */
  static async getReportById(id, user = null) {
    const report = await RadiologyReport.findOne({
      $or: [{ _id: String(id).match(/^[0-9a-fA-F]{24}$/) ? id : null }, { reportId: id }, { reportNumber: id }]
    })
      .populate('studyId')
      .populate('orderId')
      .populate('previousReportId')
      .lean();

    if (!report) {
      throw new Error(`Report '${id}' not found.`);
    }

    // Access check: if patient, verify ownership & released status
    if (user && user.role === 'PATIENT') {
      if (report.status !== 'RELEASED' && report.status !== 'AMENDED') {
        throw new Error('Report is not yet released for patient access.');
      }
    }

    // Record access in Audit log
    await AuditService.logAction({
      user,
      action: 'VIEW_RADIOLOGY_REPORT',
      entity: 'RadiologyReport',
      entityId: report._id,
      description: `Viewed/accessed radiology report ${report.reportNumber}`
    });

    return report;
  }
}

module.exports = ReportService;
