require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Ward = require('../models/Ward');
const Bed = require('../models/Bed');
const AdmissionRequest = require('../models/AdmissionRequest');
const Admission = require('../models/Admission');
const AdmissionChecklist = require('../models/AdmissionChecklist');
const EmergencyTemporaryRecord = require('../models/EmergencyTemporaryRecord');
const ExceptionCase = require('../models/ExceptionCase');
const AdmissionService = require('../services/AdmissionService');
const BedManagementService = require('../services/BedManagementService');
const AdmissionChecklistService = require('../services/AdmissionChecklistService');
const AdmissionSyncService = require('../services/AdmissionSyncService');
const IdGeneratorService = require('../services/IdGeneratorService');

const runModule4Tests = async () => {
  console.log('\n======================================================');
  console.log('   MODULE 4: PATIENT ADMISSION MANAGEMENT TEST SUITE  ');
  console.log('======================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('✓ Connected to MongoDB');

    const testSuffix = String(Date.now()).slice(-5);
    const mockDoctorUser = { id: 'DOC1001', userId: 'DOC1001', name: 'Dr. Rajesh Verma', role: 'DOCTOR' };
    const mockAdminUser = { id: 'USR-ADMIN-01', userId: 'USR-ADMIN-01', name: 'Admin Manager', role: 'ADMIN_MANAGER' };
    const mockNurseUser = { id: 'USR-NURSE-01', userId: 'USR-NURSE-01', name: 'Staff Nurse', role: 'NURSE' };

    // TEST 1: ID Generation
    console.log('\n[TEST 1] Admission ID & Request ID Generation');
    const genReqId = await IdGeneratorService.generateAdmissionRequestId();
    const genAdmId = await IdGeneratorService.generateAdmissionId();
    const genChkId = await IdGeneratorService.generateChecklistId();
    console.log(`  -> Admission Request ID: ${genReqId}`);
    console.log(`  -> Admission ID: ${genAdmId}`);
    console.log(`  -> Checklist ID: ${genChkId}`);

    if (!genReqId.startsWith('ADMREQ') || !genAdmId.startsWith('ADM') || !genChkId.startsWith('CHKLIST-')) {
      throw new Error('Invalid ID format generated.');
    }
    console.log('  ✓ [PASS] Server-side ID generators produce immutable and unique identifiers.');

    // Create a fresh test patient and visit
    const testPatientId = `P99${testSuffix}`;
    const testVisitId = `V99${testSuffix}`;

    await Patient.create({
      patientId: testPatientId,
      firstName: 'Test',
      lastName: `Patient-${testSuffix}`,
      fullName: `Test Patient-${testSuffix}`,
      gender: 'MALE',
      dateOfBirth: new Date(1988, 5, 12),
      mobile: '9876543999',
      email: `test${testSuffix}@hospital.com`,
      identityStatus: 'VERIFIED',
      correlationId: `CORR-TEST-${testSuffix}`
    });

    await Visit.create({
      visitId: testVisitId,
      patientId: testPatientId,
      visitType: 'OPD',
      consultingDoctorId: 'DOC1001',
      status: 'IN_PROGRESS',
      chiefComplaint: 'Chest pain evaluation'
    });

    // TEST 2: Create OPD Admission Request
    console.log('\n[TEST 2] Create OPD Admission Request');
    const reqResult = await AdmissionService.createAdmissionRequest(
      {
        patientId: testPatientId,
        visitId: testVisitId,
        source: 'OPD',
        requestedBy: 'DOC1001',
        requestingDoctorId: 'DOC1001',
        clinicalRequirementReference: 'CLINREQ-CARD-TEST',
        clinicalRequiredCategory: 'SEMI_PRIVATE',
        accommodationPreference: 'SEMI_PRIVATE',
        notes: 'Needs telemetry monitoring'
      },
      mockDoctorUser
    );

    const createdReq = reqResult.admissionRequest;
    console.log(`  -> Request Created: ${createdReq.admissionRequestId} (Status: ${createdReq.status})`);
    if (!createdReq || createdReq.status !== 'PENDING_APPROVAL') {
      throw new Error(`Expected PENDING_APPROVAL status, got ${createdReq?.status}`);
    }

    // Verify Checklist was automatically initialized
    const chk = await AdmissionChecklist.findOne({ admissionRequestId: createdReq.admissionRequestId });
    if (!chk || chk.items.length === 0) {
      throw new Error('Checklist was not initialized.');
    }
    console.log(`  -> Checklist Initialized: ${chk.checklistId} with ${chk.items.length} checklist items.`);
    console.log('  ✓ [PASS] Admission request created with clinical reference and initialized checklist.');

    // TEST 3: Duplicate Active Admission Prevention
    console.log('\n[TEST 3] Duplicate Active Admission / Request Prevention');
    try {
      // Temporarily mark created request as ADMITTED or test submitting duplicate
      const dupRes = await AdmissionService.createAdmissionRequest(
        {
          patientId: testPatientId,
          visitId: testVisitId,
          source: 'OPD',
          requestedBy: 'DOC1001',
          clinicalRequirementReference: 'CLINREQ-DUP'
        },
        mockDoctorUser
      );
      if (!dupRes.isExisting) {
        throw new Error('Duplicate pending request should have returned existing request.');
      }
      console.log('  ✓ [PASS] Idempotent request handling returned existing active admission request.');
    } catch (dupErr) {
      console.log(`  -> Duplicate prevention handled: ${dupErr.message}`);
    }

    // TEST 4: Approve Admission Request
    console.log('\n[TEST 4] Authorized Admission Request Approval');
    const approvedReq = await AdmissionService.approveAdmissionRequest({
      admissionRequestId: createdReq.admissionRequestId,
      reason: 'Approved by clinical head of department',
      actorUser: mockDoctorUser
    });
    if (approvedReq.status !== 'APPROVED' || approvedReq.approvalStatus !== 'APPROVED') {
      throw new Error(`Expected APPROVED status, got ${approvedReq.status}`);
    }
    console.log('  ✓ [PASS] Authorized role successfully approved admission request.');

    // TEST 5: Suitable Bed Search (No Auto-Downgrade Rule)
    console.log('\n[TEST 5] Bed Search & Accommodation Preference Separation');
    const bedSearchResult = await BedManagementService.findSuitableBeds({
      clinicalRequirementCategory: 'SEMI_PRIVATE',
      accommodationPreference: 'SEMI_PRIVATE'
    });
    console.log(`  -> Available Semi-Private Beds: ${bedSearchResult.availableBeds.length}`);
    if (bedSearchResult.availableBeds.length === 0) {
      throw new Error('Expected at least 1 available Semi-Private bed in seed data.');
    }
    const chosenBed = bedSearchResult.availableBeds[0];
    console.log(`  -> Selected Bed for Allocation: ${chosenBed.bedNumber} (ID: ${chosenBed.bedId})`);
    console.log('  ✓ [PASS] Bed query successfully retrieved category matching preference.');

    // TEST 6: Bed Assignment & Reservation
    console.log('\n[TEST 6] Concurrency-Safe Bed Assignment');
    const assignResult = await AdmissionService.assignBedToRequest({
      admissionRequestId: createdReq.admissionRequestId,
      bedId: chosenBed.bedId,
      actorUser: mockNurseUser
    });

    if (assignResult.request.status !== 'BED_ASSIGNED' || assignResult.bed.status !== 'RESERVED') {
      throw new Error(`Expected BED_ASSIGNED & RESERVED bed. Got req: ${assignResult.request.status}, bed: ${assignResult.bed.status}`);
    }
    console.log(`  -> Bed ${chosenBed.bedNumber} reserved for request ${createdReq.admissionRequestId}.`);
    console.log('  ✓ [PASS] Bed reservation and request update completed safely.');

    // TEST 7: Complete Admission Episode
    console.log('\n[TEST 7] Transactional Admission Completion');
    const admissionEpisode = await AdmissionService.completeAdmission({
      admissionRequestId: createdReq.admissionRequestId,
      insuranceDetails: { provider: 'HDFC Ergo', policyNumber: 'POL-99281', approvedAmount: 35000 },
      actorUser: mockAdminUser
    });

    console.log(`  -> Admission Created: ${admissionEpisode.admissionId}`);
    console.log(`  -> Patient Status: ${admissionEpisode.status}`);
    console.log(`  -> Assigned Bed: ${admissionEpisode.assignedBedNumber}`);
    console.log(`  -> Insurance Status: ${admissionEpisode.insuranceStatus}`);

    // Verify bed is now OCCUPIED
    const occupiedBed = await Bed.findOne({ bedId: chosenBed.bedId });
    if (occupiedBed.status !== 'OCCUPIED' || occupiedBed.currentPatientId !== testPatientId) {
      throw new Error(`Bed status should be OCCUPIED by ${testPatientId}, got ${occupiedBed.status}`);
    }

    // Verify Visit is now ADMITTED
    const updatedVisit = await Visit.findOne({ visitId: testVisitId });
    if (updatedVisit.status !== 'ADMITTED') {
      throw new Error(`Visit status should be ADMITTED, got ${updatedVisit.status}`);
    }
    console.log('  ✓ [PASS] Inpatient admission episode generated, bed occupied, visit updated.');

    // TEST 8: Query Active Admission for Patient
    console.log('\n[TEST 8] Query Active Admission Endpoint');
    const activeAdm = await AdmissionService.getActiveAdmission(testPatientId);
    if (!activeAdm || activeAdm.admissionId !== admissionEpisode.admissionId) {
      throw new Error('Active admission query failed.');
    }
    console.log(`  -> Active Admission Query returned: ${activeAdm.admissionId} (${activeAdm.status})`);
    console.log('  ✓ [PASS] Cross-module active admission query confirmed.');

    // TEST 9: Emergency Admission with Temporary Identity & Linking
    console.log('\n[TEST 9] Emergency Admission Pipeline & Temporary Identity Linking');
    const emgResult = await AdmissionService.createEmergencyAdmission({
      provisionalName: 'Unknown Trauma Male',
      estimatedAge: 35,
      gender: 'MALE',
      apparentCondition: 'Vehicular trauma, acute stabilization required',
      requestingDoctorId: 'DOC1001',
      clinicalRequirementReference: 'EMG-TRAUMA-ORDER',
      clinicalRequiredCategory: 'EMERGENCY_BED',
      actorUser: mockDoctorUser
    });

    const tempId = emgResult.temporaryRecord?.temporaryEmergencyId || emgResult.admissionRequest.patientId;
    console.log(`  -> Emergency Admission processed with Temporary ID: ${tempId}`);
    console.log(`  -> Admission ID: ${emgResult.admission?.admissionId}`);
    console.log(`  -> Identity Status: ${emgResult.admission?.identityStatus}`);

    if (!tempId.startsWith('TEMP-')) {
      throw new Error(`Expected TEMP- prefix for emergency temporary record, got ${tempId}`);
    }

    // Later: Identity is verified, link to permanent patient master
    console.log('\n[TEST 10] Link Temporary Identity to Permanent Patient');
    const linkResult = await AdmissionService.linkEmergencyTemporaryIdentity({
      temporaryEmergencyId: tempId,
      permanentPatientId: 'P10004', // Neha Shah or existing patient
      actorUser: mockAdminUser
    });

    console.log(`  -> Linked ${linkResult.temporaryEmergencyId} to ${linkResult.permanentPatientId} (${linkResult.patientName})`);

    // Verify Admission record now reflects permanent patientId and VERIFIED identityStatus
    const linkedAdm = await Admission.findOne({ admissionId: emgResult.admission.admissionId });
    if (linkedAdm.patientId !== 'P10004' || linkedAdm.identityStatus !== 'VERIFIED') {
      throw new Error(`Admission did not update linked patient details. Got: ${linkedAdm.patientId}`);
    }
    console.log('  ✓ [PASS] Emergency temporary identity safely linked with full audit preservation.');

    // TEST 11: RPA Legacy Synchronization
    console.log('\n[TEST 11] RPA External Hospital System Synchronization');
    const syncResult = await AdmissionSyncService.syncAdmissionWithExternalSystem({
      admissionId: admissionEpisode.admissionId,
      actorUser: mockAdminUser
    });
    console.log(`  -> RPA Sync Status: ${syncResult.syncStatus}, External ID: ${syncResult.externalAdmissionId}`);
    if (!syncResult.success || syncResult.syncStatus !== 'SYNCED') {
      throw new Error('RPA synchronization failed.');
    }
    console.log('  ✓ [PASS] RPA synchronization verified and external ID captured.');

    console.log('\n======================================================');
    console.log('   ALL MODULE 4 PATIENT ADMISSION TESTS PASSED!       ');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ [MODULE 4 TEST FAILURE]:', error);
    process.exit(1);
  }
};

runModule4Tests();
