/**
 * Master Test Runner: Modules 1 through 15 Acceptance Testing
 * Executes each module's automated test suite sequentially and generates a master verification report.
 */

const { execSync } = require('child_process');
const path = require('path');

const testSuites = [
  { module: 'Module 01: Patient Registration', file: 'tests/module1_test.js' },
  { module: 'Module 02: Appointment Management', file: 'tests/module2_test.js' },
  { module: 'Module 03: OPD Queue Management', file: 'tests/module3_test.js' },
  { module: 'Module 04: Patient Admission', file: 'tests/module4_test.js' },
  { module: 'Module 05: Bed Management', file: 'tests/bedManagementTest.js' },
  { module: 'Module 06: Discharge Processing', file: 'tests/module6_test.js' },
  { module: 'Module 07: Patient Records', file: 'tests/module7_test.js' },
  { module: 'Module 08: Billing & Payments', file: 'tests/module8_billing_test.js' },
  { module: 'Module 09: Insurance Verification', file: 'tests/module9_insurance_verification_test.js' },
  { module: 'Module 10: Insurance Claims', file: 'tests/module10_insurance_claims_test.js' },
  { module: 'Module 11: Doctor Management', file: 'tests/module11_doctor_management_test.js' },
  { module: 'Module 12: Staff Management', file: 'tests/module12_staff_management_test.js' },
  { module: 'Module 13: Attendance Management', file: 'tests/module13_attendance_management_test.js' },
  { module: 'Module 14: Shift Management', file: 'tests/module14_shift_management_test.js' },
  { module: 'Module 15: Leave Management', file: 'tests/module15_leave_management_test.js' }
];

console.log('================================================================================');
console.log('      HOSPITAL ADMINISTRATIVE RPA PLATFORM — MASTER TEST RUNNER (MOD 1 - 15)    ');
console.log('================================================================================\n');

const results = [];
let overallPass = true;

for (let i = 0; i < testSuites.length; i++) {
  const suite = testSuites[i];
  const startTime = Date.now();
  process.stdout.write(`[${i + 1}/${testSuites.length}] Running ${suite.module} (${suite.file})... `);

  try {
    const output = execSync(`node ${suite.file}`, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
      timeout: 120000
    }).toString();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`PASSED (${duration}s)`);
    results.push({ ...suite, status: 'PASSED', duration: `${duration}s`, error: null });
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`FAILED (${duration}s)`);
    overallPass = false;
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    const stdout = err.stdout ? err.stdout.toString() : '';
    results.push({ ...suite, status: 'FAILED', duration: `${duration}s`, error: stderr || stdout });
  }
}

console.log('\n================================================================================');
console.log('                          MASTER SCORECARD & SUMMARY                            ');
console.log('================================================================================');
console.table(results.map(r => ({
  Module: r.module,
  TestFile: r.file,
  Status: r.status,
  Duration: r.duration
})));

if (!overallPass) {
  console.log('\n❌ SOME TEST SUITES FAILED. Summary of errors:');
  results.filter(r => r.status === 'FAILED').forEach(r => {
    console.error(`\n--- [${r.module}] Error Log ---`);
    console.error(r.error);
  });
  process.exit(1);
} else {
  console.log('\n✓ ALL 15 MODULES PASSED ACCEPTANCE VERIFICATION SUCCESSFULLY (100% PASS RATE)!');
  process.exit(0);
}
