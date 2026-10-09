require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const BedManagementService = require('../services/BedManagementService');
const Ward = require('../models/Ward');
const Bed = require('../models/Bed');
const AccommodationCategory = require('../models/AccommodationCategory');
const BedAssignment = require('../models/BedAssignment');
const BedReservation = require('../models/BedReservation');
const HousekeepingTask = require('../models/HousekeepingTask');
const ExceptionCase = require('../models/ExceptionCase');

async function runBedManagementTests() {
  console.log('=== STARTING MODULE 5: BED MANAGEMENT TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('✓ Connected to MongoDB');

    // TEST 1: Accommodation Categories & Wards Master
    console.log('\n[Test 1] Testing Accommodation Categories & Ward Queries...');
    const categories = await BedManagementService.listCategories();
    if (categories.length >= 5) {
      console.log(`✓ Passed: Retrieved ${categories.length} configured accommodation categories.`);
      passed++;
    } else {
      console.error(`✗ Failed: Expected at least 5 categories, found ${categories.length}`);
      failed++;
    }

    const wards = await BedManagementService.listWards();
    if (wards.length >= 4) {
      console.log(`✓ Passed: Retrieved ${wards.length} hospital wards.`);
      passed++;
    } else {
      console.error(`✗ Failed: Expected at least 4 wards, found ${wards.length}`);
      failed++;
    }

    // TEST 2: Deterministic Bed Search & Preference Preservation (Rule 4, 5, 21)
    console.log('\n[Test 2] Testing Deterministic Bed Search Engine (No Silent Downgrade)...');
    const searchRes = await BedManagementService.searchBeds({
      clinicalRequirement: { requiredCategory: 'GENERAL_WARD' },
      accommodationPreference: { category: 'PRIVATE_ROOM' }
    });
    if (searchRes.requestedCategory === 'PRIVATE_ROOM' && searchRes.availableCount >= 1) {
      console.log(`✓ Passed: Search respected patient preference (PRIVATE_ROOM) without silent downgrade.`);
      passed++;
    } else {
      console.error('✗ Failed: Search failed to preserve category preference.');
      failed++;
    }

    // Strict Clinical Requirement Precedence
    const strictClinRes = await BedManagementService.searchBeds({
      clinicalRequirement: { requiredCategory: 'ICU' },
      accommodationPreference: { category: 'GENERAL_WARD' }
    });
    if (strictClinRes.requestedCategory === 'ICU' && strictClinRes.isStrictClinical) {
      console.log(`✓ Passed: Strict Clinical requirement (ICU) properly overrode patient general ward preference.`);
      passed++;
    } else {
      console.error('✗ Failed: Clinical requirement did not override preference.');
      failed++;
    }

    // TEST 3: Concurrency-Safe Bed Reservation & Conflict Protection (Rule 7, 14, 26)
    console.log('\n[Test 3] Testing Atomic Bed Hold & Race Condition Prevention...');
    // Reset test bed BED-GW-01 to AVAILABLE
    await Bed.findOneAndUpdate({ bedId: 'BED-GW-01' }, { status: 'AVAILABLE', reservedForPatientId: null, reservationId: null });

    const reserveResult = await BedManagementService.reserveBed({
      bedId: 'BED-GW-01',
      patientId: 'P10002',
      patientName: 'Priya Sharma',
      reservationDurationMinutes: 30,
      actorUser: { id: 'TEST_USER', role: 'RECEPTIONIST' }
    });

    if (reserveResult.bed.status === 'RESERVED' && reserveResult.bed.reservedForPatientId === 'P10002') {
      console.log(`✓ Passed: Bed BED-GW-01 atomically reserved.`);
      passed++;
    } else {
      console.error('✗ Failed to reserve bed BED-GW-01');
      failed++;
    }

    // Second reservation attempt on same bed MUST fail
    let secondReservationFailed = false;
    try {
      await BedManagementService.reserveBed({
        bedId: 'BED-GW-01',
        patientId: 'P10005',
        actorUser: { id: 'TEST_USER_2', role: 'RECEPTIONIST' }
      });
    } catch (err) {
      secondReservationFailed = true;
      console.log(`✓ Passed: Concurrent reservation conflict caught as expected: "${err.message}"`);
      passed++;
    }
    if (!secondReservationFailed) {
      console.error('✗ Failed: Double reservation was incorrectly allowed on the same bed!');
      failed++;
    }

    // TEST 4: Bed Assignment & Physical Occupation (Rule 1, 6, 7, 27)
    console.log('\n[Test 4] Testing Direct Physical Bed Assignment...');
    // Reset BED-GW-02 to AVAILABLE
    await Bed.findOneAndUpdate({ bedId: 'BED-GW-02' }, { status: 'AVAILABLE', currentPatientId: null });

    const assignResult = await BedManagementService.assignBed({
      bedId: 'BED-GW-02',
      patientId: 'P10004',
      patientName: 'Neha Shah',
      admissionId: 'ADM202610004',
      assignmentType: 'INITIAL_ADMISSION',
      actorUser: { id: 'TEST_USER', role: 'RECEPTIONIST' }
    });

    if (assignResult.bed.status === 'OCCUPIED' && assignResult.bed.currentPatientId === 'P10004') {
      console.log(`✓ Passed: Bed BED-GW-02 physically assigned to patient P10004.`);
      passed++;
    } else {
      console.error('✗ Failed to assign bed BED-GW-02');
      failed++;
    }

    // TEST 5: Two-Phase Safe Bed Transfer (Rule 28, 29, 30)
    console.log('\n[Test 5] Testing Two-Phase Safe Bed Transfer Workflow...');
    // Make BED-GW-03 AVAILABLE for transfer destination
    await Bed.findOneAndUpdate({ bedId: 'BED-GW-03' }, { status: 'AVAILABLE', currentPatientId: null });

    const transferResult = await BedManagementService.transferPatientBed({
      patientId: 'P10004',
      admissionId: 'ADM202610004',
      fromBedId: 'BED-GW-02',
      toBedId: 'BED-GW-03',
      transferReason: 'Patient room upgrade requested',
      actorUser: { id: 'TEST_USER', role: 'NURSE' }
    });

    if (
      transferResult.newBed.status === 'OCCUPIED' &&
      transferResult.newBed.currentPatientId === 'P10004' &&
      transferResult.previousBed.status === 'CLEANING_REQUIRED'
    ) {
      console.log(`✓ Passed: Two-Phase Safe Transfer completed.`);
      console.log(`  -> Destination Bed-GW-03 secured as OCCUPIED.`);
      console.log(`  -> Source Bed-GW-02 transitioned to CLEANING_REQUIRED.`);
      console.log(`  -> Housekeeping task created: ${transferResult.housekeepingTaskId}`);
      passed++;
    } else {
      console.error('✗ Failed: Two-Phase Transfer assertions not satisfied.');
      failed++;
    }

    // TEST 6: Housekeeping Turnover Workflow (Rule 8, 31, 32)
    console.log('\n[Test 6] Testing Housekeeping Cleaning Completion Turnover...');
    const cleanResult = await BedManagementService.completeHousekeepingCleaning({
      taskId: transferResult.housekeepingTaskId,
      bedId: 'BED-GW-02',
      actorUser: { id: 'HOUSEKEEPING_1', role: 'HOUSEKEEPING' }
    });

    if (cleanResult.bed.status === 'AVAILABLE' && cleanResult.task.status === 'COMPLETED') {
      console.log(`✓ Passed: Housekeeping turnover certified clean. Bed BED-GW-02 returned to AVAILABLE.`);
      passed++;
    } else {
      console.error('✗ Failed: Bed did not return to AVAILABLE upon cleaning completion.');
      failed++;
    }

    // TEST 7: Rejection of Invalid State Transitions (Rule 12, 34)
    console.log('\n[Test 7] Testing Rejection of Invalid State Machine Transitions...');
    let invalidTransitionRejected = false;
    try {
      // Attempting to put occupied bed directly into MAINTENANCE
      await BedManagementService.updateBedStatus({
        bedId: 'BED-GW-03', // currently OCCUPIED by P10004
        newStatus: 'MAINTENANCE',
        reason: 'Illegal test update',
        actorUser: { id: 'TEST_USER', role: 'ADMIN_MANAGER' }
      });
    } catch (err) {
      invalidTransitionRejected = true;
      console.log(`✓ Passed: Invalid transition OCCUPIED -> MAINTENANCE rejected: "${err.message}"`);
      passed++;
    }
    if (!invalidTransitionRejected) {
      console.error('✗ Failed: Invalid transition was not rejected!');
      failed++;
    }

    // TEST 8: Reconciliation & RPA Mismatch Detection (Rule 71, 72)
    console.log('\n[Test 8] Testing RPA Inventory Reconciliation & Exception Logging...');
    const reconResult = await BedManagementService.reconcileWithExternalSystem({
      legacyInventory: [
        { bedId: 'BED-GW-03', status: 'AVAILABLE' } // MERN has BED-GW-03 as OCCUPIED
      ],
      actorUser: { id: 'RPA_WORKER', role: 'SYSTEM' }
    });

    if (reconResult.mismatchCount >= 1 && reconResult.mismatches[0].type === 'STATUS_MISMATCH') {
      console.log(`✓ Passed: Status discrepancy detected between MERN and legacy system.`);
      const exceptionCase = await ExceptionCase.findOne({ entityId: 'BED-GW-03', exceptionType: 'BED_STATE_MISMATCH' });
      if (exceptionCase) {
        console.log(`✓ Passed: BED_STATE_MISMATCH ExceptionCase logged in database.`);
        passed++;
      } else {
        console.error('✗ Failed: ExceptionCase record was not logged.');
        failed++;
      }
    } else {
      console.error('✗ Failed: Reconciliation mismatch was not detected.');
      failed++;
    }

    // TEST 9: Operational Metrics Dashboard (Section 36, 37, 38)
    console.log('\n[Test 9] Testing Operational Dashboard Calculations...');
    const dash = await BedManagementService.getAvailabilityDashboard();
    if (dash.summary && dash.summary.total >= 20 && dash.categoryBreakdown.length > 0) {
      console.log(`✓ Passed: Live dashboard calculated ${dash.summary.total} total beds, ${dash.summary.available} available.`);
      passed++;
    } else {
      console.error('✗ Failed: Dashboard metrics calculation incorrect.');
      failed++;
    }

    // SUMMARY
    console.log(`\n=== TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED ===\n`);
    await mongoose.disconnect();
    process.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('Test Suite Fatal Error:', error);
    process.exit(1);
  }
}

runBedManagementTests();
