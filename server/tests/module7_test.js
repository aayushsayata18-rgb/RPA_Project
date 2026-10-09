require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const PatientRecordService = require('../services/PatientRecordService');
const PatientRecordSyncService = require('../services/PatientRecordSyncService');
const Patient = require('../models/Patient');
const RecordAccessLog = require('../models/RecordAccessLog');
const PatientProfileHistory = require('../models/PatientProfileHistory');
const GeneratedDocument = require('../models/GeneratedDocument');

const runModule7Tests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('=== STARTING MODULE 7 PATIENT RECORDS TESTS ===\n');

    const adminUser = { userId: 'USER-ADMIN-01', name: 'System Administrator', role: 'SYSTEM_ADMIN' };
    const patientUser = { userId: 'USER-PATIENT-01', name: 'Rahul Shah', role: 'PATIENT', linkedEntityId: 'P10045' };
    const unauthorizedPatient = { userId: 'USER-PATIENT-02', name: 'Other Patient', role: 'PATIENT', linkedEntityId: 'P99999' };

    // TEST 1: Summary Aggregation for P10045
    console.log('--- TEST 1: Summary Aggregation for Demo Patient P10045 ---');
    const summary = await PatientRecordService.getPatientSummary('P10045', adminUser);
    if (!summary.patient || summary.patient.patientId !== 'P10045') throw new Error('Patient summary missing patient record');
    if (!summary.financialOverview || summary.financialOverview.totalInvoices < 1) throw new Error('Financial overview missing');
    if (!summary.activeInsurance) throw new Error('Active insurance missing from summary');
    console.log(`✓ Patient Summary loaded: ${summary.patient.fullName}, Age: ${summary.patient.age}, Outstanding Balance: ₹${summary.financialOverview.outstandingBalance}`);

    // TEST 2: Longitudinal Timeline Assembly
    console.log('\n--- TEST 2: Longitudinal Timeline Assembly ---');
    const timeline = await PatientRecordService.getPatientTimeline('P10045', {}, adminUser);
    if (!timeline.events || timeline.events.length < 5) throw new Error(`Timeline events insufficient (found ${timeline.events?.length})`);
    console.log(`✓ Longitudinal Timeline assembled with ${timeline.total} events across lifecycle.`);
    const eventTypes = [...new Set(timeline.events.map(e => e.eventType))];
    console.log(`  Event Types present: ${eventTypes.join(', ')}`);

    // TEST 3: Domain Specific Record Retrievals
    console.log('\n--- TEST 3: Domain Specific Record Retrievals ---');
    const visits = await PatientRecordService.getPatientVisits('P10045', {}, adminUser);
    const appointments = await PatientRecordService.getPatientAppointments('P10045', {}, adminUser);
    const admissions = await PatientRecordService.getPatientAdmissions('P10045', {}, adminUser);
    const beds = await PatientRecordService.getPatientBedHistory('P10045', {}, adminUser);
    const billing = await PatientRecordService.getPatientBilling('P10045', {}, adminUser);
    const insurance = await PatientRecordService.getPatientInsurance('P10045', {}, adminUser);
    const lab = await PatientRecordService.getPatientLaboratory('P10045', {}, adminUser);
    const rad = await PatientRecordService.getPatientRadiology('P10045', {}, adminUser);
    const docs = await PatientRecordService.getPatientDocuments('P10045', {}, adminUser);

    console.log(`✓ Visits: ${visits.total}, Appointments: ${appointments.total}, Admissions: ${admissions.total}`);
    console.log(`✓ Bed Assignments: ${beds.total}, Invoices: ${billing.totalInvoices}, Payments: ${billing.totalPayments}`);
    console.log(`✓ Lab Orders: ${lab.total}, Radiology Orders: ${rad.total}, Documents: ${docs.total}`);

    // TEST 4: RBAC & Patient Privacy Verification
    console.log('\n--- TEST 4: RBAC & Patient Privacy Verification ---');
    // Patient accessing own record -> GRANTED
    const ownSummary = await PatientRecordService.getPatientSummary('P10045', patientUser);
    if (!ownSummary) throw new Error('Patient unable to access own summary');
    console.log('✓ Patient accessing own record permitted.');

    // Unauthorized Patient accessing P10045 -> BLOCKED WITH 403
    let accessBlocked = false;
    try {
      await PatientRecordService.getPatientSummary('P10045', unauthorizedPatient);
    } catch (err) {
      if (err.statusCode === 403 && err.errorCode === 'RECORD_ACCESS_DENIED') {
        accessBlocked = true;
      }
    }
    if (!accessBlocked) throw new Error('Security failure: Unauthorized patient was able to access other patient records!');
    console.log('✓ Unauthorized patient access blocked with 403 RECORD_ACCESS_DENIED.');

    // TEST 5: Document Authorization & Download
    console.log('\n--- TEST 5: Document Authorization & Download ---');
    const doc = await PatientRecordService.downloadDocument('DOC-LAB-10045', patientUser);
    if (!doc || doc.documentId !== 'DOC-LAB-10045') throw new Error('Authorized document download failed');
    console.log(`✓ Authorized Document downloaded: ${doc.title}`);

    let docBlocked = false;
    try {
      await PatientRecordService.downloadDocument('DOC-LAB-10045', unauthorizedPatient);
    } catch (err) {
      if (err.statusCode === 403) docBlocked = true;
    }
    if (!docBlocked) throw new Error('Security failure: Unauthorized document download permitted!');
    console.log('✓ Unauthorized document download blocked with 403 RECORD_ACCESS_DENIED.');

    // TEST 6: Profile Editing with Audit History
    console.log('\n--- TEST 6: Profile Editing with Audit History ---');
    const newEmail = `rahul.shah.${Date.now()}@example.com`;
    const updated = await PatientRecordService.updatePatientProfileWithAudit(
      'P10045',
      { email: newEmail },
      'Patient requested contact update',
      adminUser
    );
    if (!updated.updatedFields.includes('email')) throw new Error('Profile update failed');

    const history = await PatientProfileHistory.find({ patientId: 'P10045', field: 'email' }).sort({ timestamp: -1 });
    if (history.length === 0) throw new Error('Profile change history not saved');
    console.log(`✓ Profile updated and logged to PatientProfileHistory: ${history[0].previousValue} -> ${history[0].newValue}`);

    // Test sensitive identity restriction for PATIENT role
    let sensitiveBlocked = false;
    try {
      await PatientRecordService.updatePatientProfileWithAudit(
        'P10045',
        { firstName: 'HackedName' },
        'Malicious change',
        patientUser
      );
    } catch (err) {
      if (err.errorCode === 'SENSITIVE_IDENTITY_CHANGE_RESTRICTED') {
        sensitiveBlocked = true;
      }
    }
    if (!sensitiveBlocked) throw new Error('Security failure: Patient allowed to overwrite sensitive legal identity without verification!');
    console.log('✓ Sensitive identity modification blocked for self-service patient.');

    // TEST 7: RPA Legacy Record Synchronization
    console.log('\n--- TEST 7: RPA Legacy Record Synchronization ---');
    const syncRes = await PatientRecordSyncService.syncLegacyPatientRecord({
      patientId: 'P10045',
      syncPayload: { email: 'rahul.shah@example.com' }
    });
    if (!syncRes.success) throw new Error(`RPA sync failed: ${syncRes.message}`);
    console.log(`✓ RPA sync completed successfully. Job ID: ${syncRes.jobId}`);

    // Ambiguous matching test
    // Create two test duplicate patients
    await Patient.findOneAndUpdate({ patientId: 'P_DUP_1' }, { patientId: 'P_DUP_1', firstName: 'Duplicate', lastName: 'Person', fullName: 'Duplicate Person', dateOfBirth: new Date('1985-01-01'), gender: 'MALE', mobile: '9111122222' }, { upsert: true });
    await Patient.findOneAndUpdate({ patientId: 'P_DUP_2' }, { patientId: 'P_DUP_2', firstName: 'Duplicate', lastName: 'Person', fullName: 'Duplicate Person', dateOfBirth: new Date('1985-01-01'), gender: 'MALE', mobile: '9111122222' }, { upsert: true });

    const ambiguousSync = await PatientRecordSyncService.syncLegacyPatientRecord({
      syncPayload: { fullName: 'Duplicate Person', mobile: '9111122222' }
    });
    if (ambiguousSync.errorCode !== 'PATIENT_MATCH_AMBIGUOUS') throw new Error('RPA ambiguous match safety failed');
    console.log(`✓ RPA stopped ambiguous match for human review. Error: ${ambiguousSync.errorCode}`);

    // Clean test duplicate patients
    await Patient.deleteMany({ patientId: { $in: ['P_DUP_1', 'P_DUP_2'] } });

    // TEST 8: RPA Document Import with Deduplication
    console.log('\n--- TEST 8: RPA Document Import with Deduplication ---');
    const importRes1 = await PatientRecordSyncService.importLegacyDocument({
      patientId: 'P10045',
      documentType: 'CLINICAL_REPORT',
      title: 'Historical Echo Report 2025',
      sourceDocumentId: 'LEGACY-DOC-9001',
      checksum: 'abc123hash'
    });
    if (!importRes1.success) throw new Error('RPA document import failed');
    console.log(`✓ RPA document imported. ID: ${importRes1.document.documentId}`);

    const importRes2 = await PatientRecordSyncService.importLegacyDocument({
      patientId: 'P10045',
      documentType: 'CLINICAL_REPORT',
      title: 'Duplicate Echo Report',
      sourceDocumentId: 'LEGACY-DOC-9001',
      checksum: 'abc123hash'
    });
    if (!importRes2.duplicateDetected) throw new Error('RPA document duplicate detection failed');
    console.log('✓ RPA duplicate document detected and redundant storage prevented.');

    // TEST 9: Record Access Log & Audit Trail Verification
    console.log('\n--- TEST 9: Record Access Log & Audit Trail Verification ---');
    const accessLogs = await RecordAccessLog.find({ patientId: 'P10045' }).sort({ timestamp: -1 });
    if (accessLogs.length === 0) throw new Error('RecordAccessLog is empty');
    console.log(`✓ RecordAccessLog contains ${accessLogs.length} auditable access events.`);

    console.log('\n=== ALL MODULE 7 PATIENT RECORDS TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MODULE 7 TEST FAILED:', error);
    process.exit(1);
  }
};

runModule7Tests();
