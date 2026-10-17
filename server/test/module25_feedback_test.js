const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Feedback = require('../models/Feedback');
const FeedbackInternalNote = require('../models/FeedbackInternalNote');
const FeedbackInvestigation = require('../models/FeedbackInvestigation');
const FeedbackAssignmentHistory = require('../models/FeedbackAssignmentHistory');
const FeedbackSLA = require('../models/FeedbackSLA');

const FeedbackService = require('../services/feedback/feedbackService');
const FeedbackRoutingService = require('../services/feedback/feedbackRoutingService');
const FeedbackSLAService = require('../services/feedback/feedbackSLAService');
const FeedbackInvestigationService = require('../services/feedback/feedbackInvestigationService');
const FeedbackResponseService = require('../services/feedback/feedbackResponseService');
const FeedbackAnalyticsService = require('../services/feedback/feedbackAnalyticsService');
const FeedbackRpaService = require('../services/feedback/feedbackRpaService');
const FeedbackValidator = require('../validators/feedbackValidator');

const runTests = async () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  };

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('\n======================================================');
    console.log('   MODULE 25: PATIENT FEEDBACK & GRIEVANCES TEST SUITE ');
    console.log('======================================================\n');

    const patientUser = {
      userId: 'P10045',
      firstName: 'Rahul',
      lastName: 'Shah',
      email: 'patient@hospital.com',
      phoneNumber: '+91 98765 43210',
      role: 'PATIENT'
    };

    const managerUser = {
      userId: 'EMP-HK-001',
      firstName: 'Alice',
      lastName: 'Supervisor',
      email: 'housekeeping@hospital.com',
      role: 'HOUSEKEEPING',
      departmentId: 'DEP-HK'
    };

    const adminUser = {
      userId: 'EMP-ADMIN-01',
      firstName: 'Admin',
      lastName: 'Director',
      email: 'admin@hospital.com',
      role: 'ADMIN_MANAGER'
    };

    // --- 1. Feedback Submission & ID Format ---
    console.log('--- 1. Feedback Submission & Unique ID Generation ---');
    const submissionData = {
      subject: 'Delay in Room Cleaning Service',
      description: 'Room cleaning took over 2 hours after previous patient discharge.',
      category: 'Housekeeping',
      type: 'COMPLAINT',
      rating: 2,
      priority: 'MEDIUM',
      visitId: 'V202600123'
    };

    const createdFeedback = await FeedbackService.submitFeedback(submissionData, patientUser);
    assert(createdFeedback && createdFeedback.feedbackId, 'Feedback created with feedbackId');
    assert(/^FB-\d{4}-\d{6}$/.test(createdFeedback.feedbackId), `ID format matches FB-YYYY-NNNNNN (${createdFeedback.feedbackId})`);
    assert(createdFeedback.status === 'SUBMITTED', 'Initial status is SUBMITTED');
    assert(createdFeedback.rating === 2, 'Rating stored as 2');
    assert(createdFeedback.assignedDepartmentName !== null, 'Assigned department resolved');

    // --- 2. Deterministic Routing & Confidentiality ---
    console.log('\n--- 2. Deterministic Routing & Confidentiality Assessment ---');
    const hkRouting = await FeedbackRoutingService.resolveRouting('Housekeeping', 'COMPLAINT');
    assert(hkRouting.departmentName.toLowerCase().includes('housekeeping'), 'Housekeeping category routes to Housekeeping');

    const sensitiveAssessment = FeedbackRoutingService.assessConfidentiality(
      'Clinical',
      'Allegation of Medical Negligence',
      'Serious doctor malpractice allegation'
    );
    assert(sensitiveAssessment.level === 'RESTRICTED', 'Sensitive keywords trigger RESTRICTED confidentiality');
    assert(sensitiveAssessment.restricted === true, 'Restricted flag is true');

    const normalAssessment = FeedbackRoutingService.assessConfidentiality('Catering', 'Lunch served warm', 'Food taste average');
    assert(normalAssessment.level === 'NORMAL', 'Non-sensitive feedback defaults to NORMAL');

    // --- 3. SLA Calculation & Tracking ---
    console.log('\n--- 3. SLA Calculation & Tracking ---');
    const sla = await FeedbackSLA.findOne({ feedbackId: createdFeedback.feedbackId });
    assert(sla !== null, 'SLA tracking record created');
    assert(sla.dueAt > createdFeedback.createdAt, 'Due date is calculated into the future');
    assert(sla.slaStatus === 'ON_TRACK', 'Initial SLA status is ON_TRACK');

    // Test priority change recalculating SLA
    const updatedWithPriority = await FeedbackService.changePriority({
      feedbackId: createdFeedback.feedbackId,
      priority: 'CRITICAL',
      user: adminUser
    });
    assert(updatedWithPriority.priority === 'CRITICAL', 'Priority successfully changed to CRITICAL');
    const updatedSla = await FeedbackSLA.findOne({ feedbackId: createdFeedback.feedbackId });
    assert(updatedSla.priority === 'CRITICAL', 'SLA record priority updated');

    // --- 4. Internal Notes Privacy Separation ---
    console.log('\n--- 4. Internal Notes Privacy Separation ---');
    const note = await FeedbackService.addInternalNote({
      feedbackId: createdFeedback.feedbackId,
      note: 'Supervisor interviewed cleaning crew. Shift changeover caused queue.',
      visibility: 'INTERNAL',
      user: managerUser
    });
    assert(note && note.noteId, 'Internal note added');
    assert(/^NOTE-FB-\d{4}-\d{6}$/.test(note.noteId), `Note ID format matches NOTE-FB-YYYY-NNNNNN (${note.noteId})`);

    // Fetch as patient (should NOT contain internal notes)
    const patientView = await FeedbackService.getFeedbackById(createdFeedback.feedbackId, patientUser);
    assert(patientView.internalNotes.length === 0, 'Internal notes are strictly stripped from patient view');

    // Fetch as manager/admin (MUST contain internal notes)
    const adminView = await FeedbackService.getFeedbackById(createdFeedback.feedbackId, adminUser);
    assert(adminView.internalNotes.length > 0, 'Internal notes are accessible to authorized staff');

    // --- 5. Investigation Lifecycle ---
    console.log('\n--- 5. Investigation Workflow ---');
    const investigation = await FeedbackInvestigationService.startInvestigation({
      feedbackId: createdFeedback.feedbackId,
      investigatorId: managerUser.userId,
      investigatorName: `${managerUser.firstName} ${managerUser.lastName}`,
      notes: 'Initial inspection ordered',
      user: managerUser
    });
    assert(investigation && investigation.investigationId, 'Investigation started with unique ID');
    assert(/^INV-FB-\d{4}-\d{6}$/.test(investigation.investigationId), `Investigation ID matches format (${investigation.investigationId})`);

    const updatedInv = await FeedbackInvestigationService.updateInvestigation({
      investigationId: investigation.investigationId,
      findings: 'Discharge turnover was delayed due to surge of 4 discharges at 11 AM.',
      conclusion: 'Operational bottleneck identified in shift overlap.',
      recommendation: 'Stagger morning staff schedules.',
      status: 'COMPLETED',
      user: managerUser
    });
    assert(updatedInv.findings.includes('Discharge turnover was delayed'), 'Findings recorded');
    assert(updatedInv.status === 'COMPLETED', 'Investigation marked COMPLETED');

    const approvedInv = await FeedbackInvestigationService.approveInvestigation({
      investigationId: investigation.investigationId,
      notes: 'Approved recommendations.',
      user: adminUser
    });
    assert(approvedInv.status === 'APPROVED', 'Investigation signed off as APPROVED by supervisor');
    assert(approvedInv.approvedBy === adminUser.userId, 'ApprovedBy recorded accurately');

    // --- 6. Response Drafting & Approval Workflow ---
    console.log('\n--- 6. Response Drafting, Approval & Sending ---');
    const drafted = await FeedbackResponseService.draftResponse({
      feedbackId: createdFeedback.feedbackId,
      responseText: 'Thank you for your feedback. We have addressed shift turnover bottlenecks.',
      user: managerUser
    });
    assert(drafted.response.text.includes('addressed shift turnover'), 'Response text drafted');
    assert(drafted.status === 'RESPONSE_DRAFT', 'Status moved to RESPONSE_DRAFT');

    const approvedResp = await FeedbackResponseService.approveResponse({
      feedbackId: createdFeedback.feedbackId,
      user: adminUser
    });
    assert(approvedResp.response.status === 'APPROVED', 'Response approved by administrator');

    const sentResp = await FeedbackResponseService.sendResponse({
      feedbackId: createdFeedback.feedbackId,
      user: managerUser
    });
    assert(sentResp.status === 'RESPONSE_SENT', 'Status moved to RESPONSE_SENT');
    assert(sentResp.response.status === 'SENT', 'Response marked SENT');

    // --- 7. Resolution, Closure & Reopening ---
    console.log('\n--- 7. Resolution, Closure & Reopening Lifecycle ---');
    const resolved = await FeedbackResponseService.resolveFeedback({
      feedbackId: createdFeedback.feedbackId,
      summary: 'Action plan implemented.',
      actionTaken: 'Shift roster reconfigured.',
      user: managerUser
    });
    assert(resolved.status === 'RESOLVED', 'Feedback marked RESOLVED');
    assert(resolved.resolution.resolvedAt !== null, 'ResolvedAt timestamp recorded');

    const reopened = await FeedbackResponseService.reopenFeedback({
      feedbackId: createdFeedback.feedbackId,
      reason: 'Patient reported recurring delay during discharge yesterday.',
      user: patientUser
    });
    assert(reopened.status === 'REOPENED', 'Feedback transitioned to REOPENED');
    assert(reopened.reopen.reason.includes('recurring delay'), 'Reopen reason stored');
    assert(reopened.reopen.previousStatus === 'RESOLVED', 'Previous resolution status preserved');

    const closed = await FeedbackResponseService.closeFeedback({
      feedbackId: createdFeedback.feedbackId,
      notes: 'Follow-up consultation completed with patient satisfaction.',
      user: adminUser
    });
    assert(closed.status === 'CLOSED', 'Feedback officially CLOSED');
    assert(closed.closure.closedAt !== null, 'ClosedAt timestamp recorded');

    // --- 8. RPA External Complaint Import with Duplicate Protection ---
    console.log('\n--- 8. RPA External Import & Idempotency Duplicate Detection ---');
    const extRef = `EXT-COMP-${Date.now()}`;
    const rpaImport1 = await FeedbackRpaService.importExternalComplaint({
      externalSystem: 'LEGACY_PORTAL',
      externalReference: extRef,
      subject: 'Billing overcharge inquiry from legacy system',
      description: 'Legacy portal customer support complaint ticket',
      category: 'Billing',
      type: 'COMPLAINT',
      priority: 'MEDIUM'
    });
    assert(rpaImport1.duplicateDetected === false, 'First import successfully created new case');
    assert(rpaImport1.feedback.feedbackId !== null, 'Assigned new Feedback ID');

    // Attempt second import with same external reference
    const rpaImport2 = await FeedbackRpaService.importExternalComplaint({
      externalSystem: 'LEGACY_PORTAL',
      externalReference: extRef,
      subject: 'Billing overcharge inquiry duplicate attempt',
      description: 'Duplicate transmission'
    });
    assert(rpaImport2.duplicateDetected === true, 'Duplicate detected for same external reference');
    assert(rpaImport2.feedback.feedbackId === rpaImport1.feedback.feedbackId, 'Existing feedback returned without duplication');

    // --- 9. SLA Pause, Resume & Breach Check ---
    console.log('\n--- 9. SLA Pause, Resume & Breach Scan ---');
    const pausedSla = await FeedbackSLAService.pauseSLA(
      rpaImport1.feedback.feedbackId,
      'Awaiting patient bank statement',
      adminUser
    );
    assert(pausedSla.slaStatus === 'PAUSED', 'SLA paused');
    assert(pausedSla.pauseHistory.length > 0, 'Pause history record added');

    const resumedSla = await FeedbackSLAService.resumeSLA(
      rpaImport1.feedback.feedbackId,
      adminUser
    );
    assert(resumedSla.slaStatus !== 'PAUSED', 'SLA resumed');

    const breachCheck = await FeedbackSLAService.checkAndEscalateBreaches();
    assert(breachCheck.scanned >= 0, `Scanned ${breachCheck.scanned} active cases for breaches`);

    // --- 10. Analytics & Reporting ---
    console.log('\n--- 10. Analytics & Reporting Aggregations ---');
    const summary = await FeedbackAnalyticsService.getSummary();
    assert(summary.total > 0, `Summary reports ${summary.total} total cases`);
    assert(typeof summary.averageRating === 'number', `Average rating calculated: ${summary.averageRating}`);

    const categoryReport = await FeedbackAnalyticsService.getByCategory();
    assert(Array.isArray(categoryReport) && categoryReport.length > 0, 'Category breakdown aggregated');

    const deptReport = await FeedbackAnalyticsService.getByDepartment();
    assert(Array.isArray(deptReport) && deptReport.length > 0, 'Department performance aggregated');

    const ratingReport = await FeedbackAnalyticsService.getRatingDistribution();
    assert(ratingReport.distribution[5] !== undefined, 'Rating distribution includes 1-5 stars');

    const slaPerformance = await FeedbackAnalyticsService.getSLAPerformance();
    assert(typeof slaPerformance.complianceRate === 'number', `SLA Compliance rate: ${slaPerformance.complianceRate}%`);

    console.log('\n======================================================');
    console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('[Module 25 Test Error]:', error);
    process.exit(1);
  }
};

runTests();
