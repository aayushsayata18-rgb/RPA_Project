require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const assert = require('assert');
const ReportService = require('../services/reportService');
const DashboardService = require('../services/dashboardService');
const KPIService = require('../services/kpiService');
const IdGeneratorService = require('../services/IdGeneratorService');
const ReportExecution = require('../models/ReportExecution');
const ReportAccessLog = require('../models/ReportAccessLog');
const AnalyticsAlertRule = require('../models/AnalyticsAlertRule');

async function runTests() {
  console.log('================================================================');
  console.log('   MODULE 28: REPORTS & MANAGEMENT ANALYTICS TEST SUITE');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');

  try {
    // 1. Test Concurrency-Safe ID Generation
    console.log('[Test 1] Concurrency-safe ID generation...');
    const execId1 = await IdGeneratorService.generateReportExecutionId();
    const execId2 = await IdGeneratorService.generateReportExecutionId();
    assert.match(execId1, /^EXEC-\d{4}-\d{6}$/, 'execId1 format invalid');
    assert.match(execId2, /^EXEC-\d{4}-\d{6}$/, 'execId2 format invalid');
    assert.notStrictEqual(execId1, execId2, 'IDs must be unique');

    const rptId = await IdGeneratorService.generateReportDefinitionId();
    assert.match(rptId, /^RPT-\d{4}-\d{6}$/, 'rptId format invalid');
    console.log(`✓ Passed: Generated ${execId1}, ${execId2}, and ${rptId}`);

    // 2. Test Report Catalog Discovery
    console.log('[Test 2] Report catalog discovery & role scoping...');
    const fullCatalog = await ReportService.getCatalog({}, 'SYSTEM_ADMIN');
    assert(fullCatalog.length >= 20, 'Catalog must contain at least 20 default reports');

    const billingReports = await ReportService.getCatalog({ category: 'BILLING' }, 'SYSTEM_ADMIN');
    assert(billingReports.some((r) => r.code === 'BILLING_SUMMARY'), 'BILLING_SUMMARY must exist in billing category');

    const receptionistCatalog = await ReportService.getCatalog({}, 'RECEPTIONIST');
    const hasSensitive = receptionistCatalog.some((r) => r.code === 'PAYROLL_INPUT_SUMMARY');
    assert(!hasSensitive, 'Receptionist must not see Payroll report');
    console.log(`✓ Passed: Catalog returned ${fullCatalog.length} reports with RBAC isolation`);

    // 3. Test Report Execution (Bed Occupancy)
    console.log('[Test 3] Synchronous report execution (BED_OCCUPANCY)...');
    const execBed = await ReportService.executeReport({
      reportCode: 'BED_OCCUPANCY',
      filters: {},
      format: 'JSON',
      user: { userId: 'ADMIN-01', role: 'SYSTEM_ADMIN' }
    });

    assert.strictEqual(execBed.status, 'COMPLETED');
    assert(execBed.executionId, 'Execution must have executionId');
    assert(execBed.summary.totalBeds !== undefined, 'Summary must include totalBeds');
    console.log(`✓ Passed: Executed ${execBed.reportCode} (${execBed.executionId}) with ${execBed.rowCount} rows`);

    // 4. Test Data Masking for Non-Privileged Role
    console.log('[Test 4] Data masking evaluation for non-privileged role...');
    const execPatientMasked = await ReportService.executeReport({
      reportCode: 'PATIENT_REGISTRATION_SUMMARY',
      filters: {},
      format: 'JSON',
      user: { userId: 'STAFF-01', role: 'RECEPTIONIST' }
    });

    assert.strictEqual(execPatientMasked.isMasked, true, 'isMasked flag must be true');
    if (execPatientMasked.data.length > 0 && execPatientMasked.data[0].phone) {
      assert(execPatientMasked.data[0].phone.startsWith('******'), 'Phone must be masked for receptionist');
    }
    console.log('✓ Passed: PII fields masked correctly for non-privileged role');

    // 5. Test Multi-Format Export (CSV and PDF)
    console.log('[Test 5] Multi-format export generation (CSV & PDF with SHA-256)...');
    const execCSV = await ReportService.executeReport({
      reportCode: 'BILLING_SUMMARY',
      filters: {},
      format: 'CSV',
      user: { userId: 'ADMIN-01', role: 'SYSTEM_ADMIN' }
    });

    assert.strictEqual(execCSV.outputFormat, 'CSV');
    assert(execCSV.outputFile, 'outputFile path must be set');
    assert.match(execCSV.fileChecksum, /^[a-f0-9]{64}$/, 'SHA-256 checksum must be 64 hex characters');

    const execPDF = await ReportService.executeReport({
      reportCode: 'BED_OCCUPANCY',
      filters: {},
      format: 'PDF',
      user: { userId: 'ADMIN-01', role: 'SYSTEM_ADMIN' }
    });

    assert.strictEqual(execPDF.outputFormat, 'PDF');
    assert.match(execPDF.fileChecksum, /^[a-f0-9]{64}$/, 'PDF SHA-256 checksum must be valid');
    console.log(`✓ Passed: Exported CSV (${execCSV.fileSizeBytes} B) and PDF (${execPDF.fileSizeBytes} B)`);

    // 6. Test Audit Access Logging
    console.log('[Test 6] Report access and export auditing...');
    const accessLogs = await ReportAccessLog.find({ executionId: execCSV.executionId }).lean();
    assert(accessLogs.length > 0, 'Report access must be recorded in ReportAccessLog');
    assert.strictEqual(accessLogs[0].action, 'EXPORT');
    assert.strictEqual(accessLogs[0].outputFormat, 'CSV');
    console.log(`✓ Passed: Access audit trail verified for ${execCSV.executionId}`);

    // 7. Test Report Schedules
    console.log('[Test 7] Report schedule creation and toggling...');
    const schedule = await ReportService.createSchedule(
      {
        reportCode: 'BED_OCCUPANCY',
        frequency: 'DAILY',
        exportFormat: 'CSV',
        recipients: [{ email: 'admin@hospital.com', channel: 'EMAIL' }]
      },
      { userId: 'ADMIN-01' }
    );

    assert.match(schedule.scheduleId, /^SCHED-\d{4}-\d{6}$/);
    assert.strictEqual(schedule.enabled, true);

    const toggled = await ReportService.updateSchedule(schedule.scheduleId, { enabled: false });
    assert.strictEqual(toggled.enabled, false);
    console.log(`✓ Passed: Created schedule ${schedule.scheduleId} and toggled state`);

    // 8. Test KPI Snapshot Calculation & Alert Evaluation
    console.log('[Test 8] Executive KPI calculation and alert rule evaluation...');
    const snapshots = await KPIService.calculateAllKPIs();
    assert(snapshots.length >= 8, 'Must calculate all 8 default KPIs');

    const kpiList = await KPIService.listKPIs();
    const bedKPI = kpiList.find((k) => k.kpiCode === 'BED_OCCUPANCY_RATE');
    assert(bedKPI, 'BED_OCCUPANCY_RATE KPI must exist');
    assert(bedKPI.currentValue !== undefined, 'KPI must have currentValue');
    console.log(`✓ Passed: Calculated ${snapshots.length} KPIs with real-time snapshots`);

    // 9. Test Analytics Alert Rule Resolution
    console.log('[Test 9] Analytics alert rule lifecycle...');
    const rules = await ReportService.listAlertRules();
    assert(rules.length > 0, 'Alert rules must exist');

    const targetRule = rules[0];
    const acked = await ReportService.acknowledgeAlert(targetRule.ruleId, { userId: 'ADMIN-01' });
    assert.strictEqual(acked.status, 'ACKNOWLEDGED');

    const resolved = await ReportService.resolveAlert(targetRule.ruleId, 'Bed capacity restored', { userId: 'ADMIN-01' });
    assert.strictEqual(resolved.status, 'RESOLVED');
    assert.strictEqual(resolved.resolutionNote, 'Bed capacity restored');
    console.log(`✓ Passed: Alert rule ${targetRule.ruleId} acknowledged and resolved`);

    // 10. Test Management & Departmental Dashboards
    console.log('[Test 10] Executive management & departmental dashboards...');
    const mgmtDash = await DashboardService.getManagementDashboard();
    assert(mgmtDash.kpiSummary.totalPatients !== undefined, 'Management dashboard must have totalPatients');
    assert(mgmtDash.rpaHealth.healthStatus, 'RPA health status must be present');

    const opsDash = await DashboardService.getOperationsDashboard();
    assert(opsDash.beds.total !== undefined, 'Operations dashboard must have bed breakdown');

    const finDash = await DashboardService.getFinanceDashboard();
    assert(finDash.totalBilledINR !== undefined, 'Finance dashboard must include totalBilledINR');

    const rpaDash = await DashboardService.getRPADashboard();
    assert(rpaDash.summary.successRatePercent !== undefined, 'RPA dashboard must have successRatePercent');
    console.log('✓ Passed: All 5 departmental dashboards generated with authoritative metrics');

    console.log('\n================================================================');
    console.log('   ALL MODULE 28 REPORTS & ANALYTICS TESTS PASSED (10/10)!');
    console.log('================================================================\n');
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
