const Feedback = require('../models/Feedback');
const FeedbackInternalNote = require('../models/FeedbackInternalNote');
const FeedbackInvestigation = require('../models/FeedbackInvestigation');
const FeedbackAssignmentHistory = require('../models/FeedbackAssignmentHistory');
const FeedbackSLA = require('../models/FeedbackSLA');
const User = require('../models/User');
const Department = require('../models/Department');

const seedModule25Feedback = async () => {
  try {
    console.log('[Seed Module 25] Seeding Patient Feedback, Complaints & Grievance Master & Demo Records...');

    // Fetch key actors
    const hkManager = await User.findOne({ role: 'HOUSEKEEPING' }).lean();
    const billingStaff = await User.findOne({ role: 'BILLING_STAFF' }).lean();
    const adminUser = await User.findOne({ role: 'ADMIN_MANAGER' }).lean();
    const sysAdmin = await User.findOne({ role: 'SYSTEM_ADMIN' }).lean();

    const hkDept = await Department.findOne({ code: 'HOUSEKEEPING' }).lean();
    const finDept = await Department.findOne({ code: 'FINANCE' }).lean();
    const pharmDept = await Department.findOne({ code: 'PHARMACY' }).lean();
    const mntDept = await Department.findOne({ code: 'MAINTENANCE' }).lean();
    const recDept = await Department.findOne({ code: 'RECEPTION' }).lean();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    const demoFeedbacks = [
      // 1. Scenario 1: Normal Feedback (Closed)
      {
        feedbackId: 'FB-2026-000001',
        patientId: 'P10045',
        patientName: 'Rahul Shah',
        patientEmail: 'patient@hospital.com',
        patientPhone: '+91 98765 43210',
        type: 'SERVICE_FEEDBACK',
        category: 'Reception',
        source: 'PATIENT_PORTAL',
        subject: 'Prompt and smooth outpatient reception experience',
        description: 'Front desk receptionist was prompt, courteous and efficient during outpatient registration.',
        rating: 5,
        priority: 'LOW',
        status: 'CLOSED',
        assignedDepartmentId: recDept ? recDept.departmentId : 'DEP-REC',
        assignedDepartmentName: recDept ? recDept.name : 'Reception Department',
        assignedTo: recDept?.headOfDepartment || 'EMP-REC-01',
        assignedToName: 'Front Desk Lead',
        dueAt: new Date(now.getTime() + 120 * 60 * 60 * 1000),
        slaStatus: 'ON_TRACK',
        confidentiality: { level: 'NORMAL', restricted: false },
        closure: {
          closedBy: adminUser?.userId || 'EMP-ADMIN-01',
          closedByName: 'Admin Manager',
          closedAt: now,
          notes: 'Feedback recorded and acknowledged.'
        },
        createdAt: threeDaysAgo
      },

      // 2. Scenario 2: Housekeeping Complaint (Resolved - Acceptance Scenario from Section 124)
      {
        feedbackId: 'FB-2026-000124',
        patientId: 'P10045',
        patientName: 'Rahul Shah',
        patientEmail: 'patient@hospital.com',
        patientPhone: '+91 98765 43210',
        visitId: 'V202600123',
        admissionId: 'ADM10023',
        type: 'COMPLAINT',
        category: 'Housekeeping',
        source: 'PATIENT_PORTAL',
        subject: 'Room cleaning delay',
        description: 'Room cleaning was delayed after discharge.',
        rating: 2,
        priority: 'MEDIUM',
        status: 'RESOLVED',
        assignedDepartmentId: hkDept ? hkDept.departmentId : 'DEP-HK',
        assignedDepartmentName: hkDept ? hkDept.name : 'Housekeeping Department',
        assignedTo: hkManager?.userId || 'EMP-HK-001',
        assignedToName: 'Housekeeping Supervisor',
        dueAt: new Date(twoDaysAgo.getTime() + 72 * 60 * 60 * 1000),
        slaStatus: 'ON_TRACK',
        confidentiality: { level: 'NORMAL', restricted: false },
        response: {
          text: 'Thank you for bringing this matter to our attention. The concerned housekeeping supervisor has reviewed the turnover protocol and reinforced shift turnover checklists.',
          respondedBy: hkManager?.userId || 'EMP-HK-001',
          respondedByName: 'Housekeeping Supervisor',
          respondedAt: oneDayAgo,
          approvedBy: adminUser?.userId || 'EMP-ADMIN-01',
          approvedByName: 'Admin Manager',
          approvedAt: oneDayAgo,
          status: 'SENT'
        },
        resolution: {
          summary: 'Turnover workflow audited and checklist verified.',
          actionTaken: 'Shift roster rebalanced and sanitation turnover notification verified.',
          resolvedBy: hkManager?.userId || 'EMP-HK-001',
          resolvedByName: 'Housekeeping Supervisor',
          resolvedAt: oneDayAgo
        },
        createdAt: twoDaysAgo
      },

      // 3. Scenario 3: Billing Complaint (Under Review)
      {
        feedbackId: 'FB-2026-000125',
        patientId: 'P10045',
        patientName: 'Rahul Shah',
        patientEmail: 'patient@hospital.com',
        patientPhone: '+91 98765 43210',
        invoiceId: 'INV20260915-01',
        type: 'BILLING_FEEDBACK',
        category: 'Billing',
        source: 'PATIENT_PORTAL',
        subject: 'Billing query regarding pharmacy line item',
        description: 'Patient requested itemized breakdown and rate explanation for discharge medication package.',
        rating: 3,
        priority: 'MEDIUM',
        status: 'UNDER_REVIEW',
        assignedDepartmentId: finDept ? finDept.departmentId : 'DEP-FIN',
        assignedDepartmentName: finDept ? finDept.name : 'Finance & Billing',
        assignedTo: billingStaff?.userId || 'EMP-BIL-01',
        assignedToName: 'Billing Staff',
        dueAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        slaStatus: 'ON_TRACK',
        confidentiality: { level: 'NORMAL', restricted: false },
        createdAt: oneDayAgo
      },

      // 4. Scenario 4: Reopened Complaint (Pharmacy TAT)
      {
        feedbackId: 'FB-2026-000126',
        patientId: 'P10045',
        patientName: 'Rahul Shah',
        patientEmail: 'patient@hospital.com',
        patientPhone: '+91 98765 43210',
        type: 'COMPLAINT',
        category: 'Pharmacy',
        source: 'PATIENT_PORTAL',
        subject: 'Medication dispensing delay at outpatient pharmacy counter',
        description: 'Waited over 45 minutes for prescription verification and dispensing.',
        rating: 2,
        priority: 'HIGH',
        status: 'REOPENED',
        assignedDepartmentId: pharmDept ? pharmDept.departmentId : 'DEP-PHARM',
        assignedDepartmentName: pharmDept ? pharmDept.name : 'Pharmacy Department',
        assignedTo: pharmDept?.headOfDepartment || 'EMP-PHARM-01',
        assignedToName: 'Chief Pharmacist',
        dueAt: new Date(now.getTime() + 18 * 60 * 60 * 1000),
        slaStatus: 'AT_RISK',
        confidentiality: { level: 'NORMAL', restricted: false },
        reopen: {
          reopenedBy: 'P10045',
          reopenedByName: 'Rahul Shah',
          reopenedAt: now,
          reason: 'Patient reported recurrence during evening peak hour visit.',
          previousStatus: 'RESOLVED'
        },
        createdAt: twoDaysAgo
      },

      // 5. Scenario 5: Sensitive / Restricted Complaint
      {
        feedbackId: 'FB-2026-000127',
        patientId: 'P10045',
        patientName: 'Rahul Shah',
        patientEmail: 'patient@hospital.com',
        patientPhone: '+91 98765 43210',
        type: 'COMPLAINT',
        category: 'Clinical Service',
        source: 'AUTHORIZED_STAFF_ENTRY',
        subject: 'Confidential clinical care communication grievance',
        description: 'Patient requested confidential review regarding doctor communication during bedside round.',
        rating: 2,
        priority: 'HIGH',
        status: 'INVESTIGATION',
        assignedDepartmentId: 'DEP-CLINICAL',
        assignedDepartmentName: 'Medical Administration',
        assignedTo: adminUser?.userId || 'EMP-ADMIN-01',
        assignedToName: 'Admin Manager',
        dueAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        slaStatus: 'ON_TRACK',
        confidentiality: { level: 'RESTRICTED', restricted: true },
        createdAt: oneDayAgo
      },

      // 6. Scenario 6: SLA Breached / Escalated Case
      {
        feedbackId: 'FB-2026-000128',
        patientId: 'P10045',
        patientName: 'Rahul Shah',
        patientEmail: 'patient@hospital.com',
        patientPhone: '+91 98765 43210',
        type: 'COMPLAINT',
        category: 'Maintenance',
        source: 'PATIENT_PORTAL',
        subject: 'Ward air conditioning malfunction',
        description: 'Air conditioner in room 102 was noisy and cooling insufficiently.',
        rating: 1,
        priority: 'HIGH',
        status: 'ESCALATED',
        assignedDepartmentId: mntDept ? mntDept.departmentId : 'DEP-MNT',
        assignedDepartmentName: mntDept ? mntDept.name : 'Biomedical & Maintenance',
        assignedTo: mntDept?.headOfDepartment || 'EMP-MNT-01',
        assignedToName: 'Maintenance Lead',
        dueAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // In the past!
        slaStatus: 'BREACHED',
        confidentiality: { level: 'NORMAL', restricted: false },
        createdAt: twoDaysAgo
      }
    ];

    for (const fb of demoFeedbacks) {
      await Feedback.findOneAndUpdate({ feedbackId: fb.feedbackId }, fb, { upsert: true, new: true });

      // Seed SLA record
      await FeedbackSLA.findOneAndUpdate(
        { feedbackId: fb.feedbackId },
        {
          slaId: `SLA-${fb.feedbackId}`,
          feedbackId: fb.feedbackId,
          priority: fb.priority,
          submittedAt: fb.createdAt,
          dueAt: fb.dueAt,
          resolvedAt: fb.resolution ? fb.resolution.resolvedAt : null,
          closedAt: fb.closure ? fb.closure.closedAt : null,
          slaStatus: fb.slaStatus,
          breachedAt: fb.slaStatus === 'BREACHED' ? fb.dueAt : null
        },
        { upsert: true, new: true }
      );
    }

    // Seed Investigation for FB-2026-000124 (Housekeeping)
    await FeedbackInvestigation.findOneAndUpdate(
      { investigationId: 'INV-FB-2026-000124' },
      {
        investigationId: 'INV-FB-2026-000124',
        feedbackId: 'FB-2026-000124',
        investigatorId: hkManager?.userId || 'EMP-HK-001',
        investigatorName: 'Housekeeping Supervisor',
        startedAt: twoDaysAgo,
        dueAt: new Date(twoDaysAgo.getTime() + 24 * 60 * 60 * 1000),
        findings: 'Reviewed housekeeping turnover audit log. Discharge cleaning was delayed by 35 minutes due to overlapping discharge surge in Ward A.',
        evidence: [
          {
            documentId: 'DOC-HK-LOG-101',
            description: 'Housekeeping Turnover Time Log - Ward A',
            url: '/uploads/housekeeping/log-101.pdf',
            uploadedAt: twoDaysAgo
          }
        ],
        conclusion: 'Turnover delay was operational due to shift peak; no equipment failure occurred.',
        recommendation: 'Adjust morning shift staggered staffing to support 11:00 AM discharge peaks.',
        status: 'APPROVED',
        approvedBy: adminUser?.userId || 'EMP-ADMIN-01',
        approvedByName: 'Admin Manager',
        approvedAt: oneDayAgo,
        notes: 'Supervisor briefed team; recommended roster adjustment approved.'
      },
      { upsert: true, new: true }
    );

    // Seed Internal Notes for FB-2026-000124
    await FeedbackInternalNote.findOneAndUpdate(
      { noteId: 'NOTE-FB-2026-000124-01' },
      {
        noteId: 'NOTE-FB-2026-000124-01',
        feedbackId: 'FB-2026-000124',
        authorId: hkManager?.userId || 'EMP-HK-001',
        authorName: 'Housekeeping Supervisor',
        authorRole: 'HOUSEKEEPING',
        note: 'Spoke with floor sanitation attendant. Peak turnover was between 11 AM - 1 PM. Attendant handled 4 turnovers consecutively.',
        visibility: 'INTERNAL'
      },
      { upsert: true, new: true }
    );

    await FeedbackInternalNote.findOneAndUpdate(
      { noteId: 'NOTE-FB-2026-000124-02' },
      {
        noteId: 'NOTE-FB-2026-000124-02',
        feedbackId: 'FB-2026-000124',
        authorId: adminUser?.userId || 'EMP-ADMIN-01',
        authorName: 'Admin Manager',
        authorRole: 'ADMIN_MANAGER',
        note: 'Approved response draft. Ensure patient receives update on portal.',
        visibility: 'MANAGEMENT_ONLY'
      },
      { upsert: true, new: true }
    );

    // Seed Assignment History for FB-2026-000124
    await FeedbackAssignmentHistory.findOneAndUpdate(
      { assignmentId: 'ASGN-FB-2026-000124' },
      {
        assignmentId: 'ASGN-FB-2026-000124',
        feedbackId: 'FB-2026-000124',
        fromDepartmentId: 'DEP-ADMIN',
        fromDepartmentName: 'Central Administration',
        toDepartmentId: hkDept ? hkDept.departmentId : 'DEP-HK',
        toDepartmentName: hkDept ? hkDept.name : 'Housekeeping Department',
        fromUserId: 'SYSTEM',
        fromUserName: 'Automated Routing Engine',
        toUserId: hkManager?.userId || 'EMP-HK-001',
        toUserName: 'Housekeeping Supervisor',
        reason: 'Automated deterministic category routing to Housekeeping',
        assignedBy: 'SYSTEM',
        assignedByName: 'Automated Routing Engine',
        assignedAt: twoDaysAgo
      },
      { upsert: true, new: true }
    );

    console.log('[Seed Module 25] Successfully seeded Module 25 Patient Feedback Master & Demo cases!');
  } catch (error) {
    console.error('[Seed Module 25 Error]:', error);
    throw error;
  }
};

module.exports = seedModule25Feedback;
