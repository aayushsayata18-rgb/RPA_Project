import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalLayout } from '../layouts/PortalLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { RpaDashboardPage } from '../pages/RpaDashboardPage';
import { ExceptionsPage } from '../pages/ExceptionsPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { HospitalConfigPage } from '../pages/HospitalConfigPage';
import { UsersMasterPage } from '../pages/UsersMasterPage';

// Module 1: Patient Registration Pages
import { OnlineRegistrationPage } from '../pages/patient/OnlineRegistrationPage';
import { RegistrationSuccessPage } from '../pages/patient/RegistrationSuccessPage';
import { PatientProfilePage } from '../pages/patient/PatientProfilePage';
import { PatientVisitsPage } from '../pages/patient/PatientVisitsPage';
import { FrontDeskRegistrationPage } from '../pages/operations/FrontDeskRegistrationPage';
import { PatientSearchPage } from '../pages/operations/PatientSearchPage';
import { PatientDetailPage } from '../pages/operations/PatientDetailPage';
import { IdentityReviewPage } from '../pages/operations/IdentityReviewPage';
import { EmergencyRegistrationPage } from '../pages/operations/EmergencyRegistrationPage';
import { RegistrationsListPage } from '../pages/operations/RegistrationsListPage';

// Module 2: Appointment Management Pages
import { PatientAppointmentsPage } from '../pages/patient/PatientAppointmentsPage';
import { BookAppointmentPage } from '../pages/patient/BookAppointmentPage';
import { OperationsAppointmentsPage } from '../pages/operations/OperationsAppointmentsPage';
import { DoctorAppointmentsPage } from '../pages/clinical/DoctorAppointmentsPage';

// Module 3: OPD Queue Management Pages
import { PatientOnlineCheckInPage } from '../pages/patient/PatientOnlineCheckInPage';
import { PatientLiveQueuePage } from '../pages/patient/PatientLiveQueuePage';
import { OperationsOpdQueuePage } from '../pages/operations/OperationsOpdQueuePage';
import { DoctorOpdQueuePage } from '../pages/clinical/DoctorOpdQueuePage';

// Module 4: Patient Admission Pages
import { DoctorAdmissionRequestPage } from '../pages/clinical/DoctorAdmissionRequestPage';
import { OperationsAdmissionsPage } from '../pages/operations/OperationsAdmissionsPage';
import { AdmissionDetailPage } from '../pages/operations/AdmissionDetailPage';
import { PatientAdmissionsPage } from '../pages/patient/PatientAdmissionsPage';

// Module 5: Bed Management Pages
import { BedManagementPage } from '../pages/operations/BedManagementPage';
import { BedDetailPage } from '../pages/operations/BedDetailPage';

// Module 6: Discharge Processing Pages
import { OperationsDischargesPage } from '../pages/operations/OperationsDischargesPage';
import { DischargeDetailPage } from '../pages/operations/DischargeDetailPage';
import { DoctorDischargePage } from '../pages/clinical/DoctorDischargePage';
import { PatientDischargesPage } from '../pages/patient/PatientDischargesPage';

// Module 7: Patient Records & Longitudinal Dossier Pages
import { PatientRecordsPage } from '../pages/patient/PatientRecordsPage';
import { PatientRecordsManagementPage } from '../pages/operations/PatientRecordsManagementPage';

// Module 8: Billing & Payment Management Pages
import { BillingManagementPage } from '../pages/operations/BillingManagementPage';
import { InvoiceDetailPage } from '../pages/operations/InvoiceDetailPage';
import { PatientBillsPage } from '../pages/patient/PatientBillsPage';

// Module 9: Insurance Verification Pages
import { InsuranceDashboardPage } from '../pages/operations/InsuranceDashboardPage';
import { PatientInsurancePage as OperationsPatientInsurancePage } from '../pages/operations/PatientInsurancePage';
import { VerificationDetailPage } from '../pages/operations/VerificationDetailPage';
import { PatientInsurancePage } from '../pages/patient/PatientInsurancePage';

// Module 10: Insurance Claims Management Pages
import { ClaimsDashboardPage } from '../pages/operations/ClaimsDashboardPage';
import { ClaimCreatePage } from '../pages/operations/ClaimCreatePage';
import { ClaimDetailPage } from '../pages/operations/ClaimDetailPage';
import { PatientClaimsPage } from '../pages/patient/PatientClaimsPage';

// Module 11: Doctor Management Pages
import { DoctorDashboardPage } from '../pages/doctors/DoctorDashboardPage';
import { DoctorListPage } from '../pages/doctors/DoctorListPage';
import { DoctorCreatePage } from '../pages/doctors/DoctorCreatePage';
import { DoctorDetailPage } from '../pages/doctors/DoctorDetailPage';
import { DoctorScheduleCalendarPage } from '../pages/doctors/DoctorScheduleCalendarPage';
import { DoctorAvailabilityPage } from '../pages/doctors/DoctorAvailabilityPage';

// Module 12: Staff Management Pages
import { StaffDashboardPage } from '../pages/staff/StaffDashboardPage';
import { StaffListPage } from '../pages/staff/StaffListPage';
import { StaffCreatePage } from '../pages/staff/StaffCreatePage';
import { StaffDetailPage } from '../pages/staff/StaffDetailPage';
import { StaffAccessRequestsPage } from '../pages/staff/StaffAccessRequestsPage';
import { StaffSelfProfilePage } from '../pages/staff/StaffSelfProfilePage';

// Module 13: Attendance Management Pages
import { AttendanceDashboardPage } from '../pages/attendance/AttendanceDashboardPage';
import { DailyAttendancePage } from '../pages/attendance/DailyAttendancePage';
import { AttendanceDetailPage } from '../pages/attendance/AttendanceDetailPage';
import { AttendanceCorrectionsPage } from '../pages/attendance/AttendanceCorrectionsPage';
import { AttendanceImportPage } from '../pages/attendance/AttendanceImportPage';
import { AttendanceReconciliationPage } from '../pages/attendance/AttendanceReconciliationPage';
import { AttendanceReportsPage } from '../pages/attendance/AttendanceReportsPage';
import { MyAttendancePage } from '../pages/attendance/MyAttendancePage';

// Module 14: Shift Management Pages
import { ShiftDashboardPage } from '../pages/shifts/ShiftDashboardPage';
import { ShiftDefinitionsPage } from '../pages/shifts/ShiftDefinitionsPage';
import { RosterCalendarPage } from '../pages/shifts/RosterCalendarPage';
import { ShiftConflictsPage } from '../pages/shifts/ShiftConflictsPage';
import { ShiftRequestsPage } from '../pages/shifts/ShiftRequestsPage';
import { ShiftReportsPage } from '../pages/shifts/ShiftReportsPage';
import { MySchedulePage } from '../pages/shifts/MySchedulePage';

// Module 15: Leave Management Pages
import { LeaveDashboardPage } from '../pages/leave/LeaveDashboardPage';
import { MyLeavePage } from '../pages/leave/MyLeavePage';
import { LeaveRequestPage } from '../pages/leave/LeaveRequestPage';
import { LeaveApprovalsPage } from '../pages/leave/LeaveApprovalsPage';
import { LeaveCalendarPage } from '../pages/leave/LeaveCalendarPage';
import { LeavePoliciesPage } from '../pages/leave/LeavePoliciesPage';
import { LeaveReportsPage } from '../pages/leave/LeaveReportsPage';

// Module 16: Payroll Support Pages
import { PayrollDashboard } from '../pages/payroll/PayrollDashboard';
import { PayrollPeriodsPage } from '../pages/payroll/PayrollPeriodsPage';
import { PayrollReviewPage } from '../pages/payroll/PayrollReviewPage';
import { PayrollResultsPage } from '../pages/payroll/PayrollResultsPage';
import { PayrollSalaryConfigPage } from '../pages/payroll/PayrollSalaryConfigPage';
import { PayrollExceptionsPage } from '../pages/payroll/PayrollExceptionsPage';
import { PayrollReportsPage } from '../pages/payroll/PayrollReportsPage';
import { MyPayrollPage } from '../pages/payroll/MyPayrollPage';
import { PayslipsPage } from '../pages/payroll/PayslipsPage';
import { PayrollQueriesPage } from '../pages/payroll/PayrollQueriesPage';

// Module 17: Pharmacy Management Pages
import { PharmacyDashboardPage } from '../pages/operations/pharmacy/PharmacyDashboardPage';
import { MedicineCatalogPage } from '../pages/operations/pharmacy/MedicineCatalogPage';
import { PrescriptionQueuePage } from '../pages/operations/pharmacy/PrescriptionQueuePage';
import { PharmacyOrderQueuePage } from '../pages/operations/pharmacy/PharmacyOrderQueuePage';
import { DispensingConsolePage } from '../pages/operations/pharmacy/DispensingConsolePage';
import { DispensingHistoryPage } from '../pages/operations/pharmacy/DispensingHistoryPage';
import { PharmacyReturnsPage } from '../pages/operations/pharmacy/PharmacyReturnsPage';
import { PharmacyAlertsPage } from '../pages/operations/pharmacy/PharmacyAlertsPage';
import { PharmacyReportsPage } from '../pages/operations/pharmacy/PharmacyReportsPage';
import { PatientPharmacyPage } from '../pages/patient/PatientPharmacyPage';

// Module 18: Medical Inventory Management Pages
import { InventoryDashboardPage } from '../pages/operations/inventory/InventoryDashboardPage';
import { InventoryItemsPage } from '../pages/operations/inventory/InventoryItemsPage';
import { InventoryItemDetailPage } from '../pages/operations/inventory/InventoryItemDetailPage';
import { BatchManagementPage } from '../pages/operations/inventory/BatchManagementPage';
import { StockLocationsPage } from '../pages/operations/inventory/StockLocationsPage';
import { GoodsReceiptPage } from '../pages/operations/inventory/GoodsReceiptPage';
import { StockTransfersPage } from '../pages/operations/inventory/StockTransfersPage';
import { StockAdjustmentsPage } from '../pages/operations/inventory/StockAdjustmentsPage';
import { StockCountsPage } from '../pages/operations/inventory/StockCountsPage';
import { ReconciliationPage } from '../pages/operations/inventory/ReconciliationPage';
import { InventoryAlertsPage } from '../pages/operations/inventory/InventoryAlertsPage';
import { InventoryReportsPage } from '../pages/operations/inventory/InventoryReportsPage';

// Module 19: Procurement Management Pages
import { ProcurementDashboard } from '../pages/operations/procurement/ProcurementDashboard';
import { PurchaseRequestsPage } from '../pages/operations/procurement/PurchaseRequestsPage';
import { PurchaseRequestDetailPage } from '../pages/operations/procurement/PurchaseRequestDetailPage';
import { ApprovalQueuePage } from '../pages/operations/procurement/ApprovalQueuePage';
import { RfqsPage } from '../pages/operations/procurement/RfqsPage';
import { QuotationManagementPage } from '../pages/operations/procurement/QuotationManagementPage';
import { QuotationComparisonPage } from '../pages/operations/procurement/QuotationComparisonPage';
import { PurchaseOrdersPage } from '../pages/operations/procurement/PurchaseOrdersPage';
import { PurchaseOrderDetailPage } from '../pages/operations/procurement/PurchaseOrderDetailPage';
import { DeliveryTrackingPage } from '../pages/operations/procurement/DeliveryTrackingPage';
import { InvoiceMatchingPage } from '../pages/operations/procurement/InvoiceMatchingPage';
import { ProcurementExceptionsPage } from '../pages/operations/procurement/ProcurementExceptionsPage';
import { ProcurementReportsPage } from '../pages/operations/procurement/ProcurementReportsPage';

// Module 20: Vendor Management Pages
import { VendorDashboard } from '../pages/operations/vendors/VendorDashboard';
import { VendorList } from '../pages/operations/vendors/VendorList';
import { VendorRegistration } from '../pages/operations/vendors/VendorRegistration';
import { VendorDetails } from '../pages/operations/vendors/VendorDetails';
import { VendorDocumentsPage } from '../pages/operations/vendors/VendorDocumentsPage';
import { VendorContractsPage } from '../pages/operations/vendors/VendorContractsPage';
import { VendorIssuesPage } from '../pages/operations/vendors/VendorIssuesPage';
import { VendorPortalPage } from '../pages/vendor/VendorPortalPage';

// Module 21: Laboratory Administration Pages
import { LaboratoryDashboard } from '../pages/operations/laboratory/LaboratoryDashboard';
import { LabTests } from '../pages/operations/laboratory/LabTests';
import { LabOrders } from '../pages/operations/laboratory/LabOrders';
import { LabOrderDetails } from '../pages/operations/laboratory/LabOrderDetails';
import { CollectionQueue } from '../pages/operations/laboratory/CollectionQueue';
import { SampleReception } from '../pages/operations/laboratory/SampleReception';
import { ProcessingQueue } from '../pages/operations/laboratory/ProcessingQueue';
import { ResultEntry } from '../pages/operations/laboratory/ResultEntry';
import { VerificationQueue } from '../pages/operations/laboratory/VerificationQueue';
import { LabReports } from '../pages/operations/laboratory/LabReports';
import { RejectedSamples } from '../pages/operations/laboratory/RejectedSamples';
import { LabExceptions } from '../pages/operations/laboratory/LabExceptions';
import { LabAnalytics } from '../pages/operations/laboratory/LabAnalytics';
import { PatientLabPage } from '../pages/patient/PatientLabPage';

// Module 22: Radiology Administration Pages
import { RadiologyDashboard } from '../pages/operations/radiology/RadiologyDashboard';
import { RadiologyExams } from '../pages/operations/radiology/RadiologyExams';
import { Modalities } from '../pages/operations/radiology/Modalities';
import { RadiologyOrders } from '../pages/operations/radiology/RadiologyOrders';
import { RadiologyScheduling } from '../pages/operations/radiology/RadiologyScheduling';
import { PatientCheckIn } from '../pages/operations/radiology/PatientCheckIn';
import { ProcedureQueue } from '../pages/operations/radiology/ProcedureQueue';
import { Studies } from '../pages/operations/radiology/Studies';
import { ReportingQueue } from '../pages/operations/radiology/ReportingQueue';
import { RadiologyReports } from '../pages/operations/radiology/RadiologyReports';
import { RadiologyExceptions } from '../pages/operations/radiology/RadiologyExceptions';
import { RadiologyAnalytics } from '../pages/operations/radiology/RadiologyAnalytics';
import { PatientRadiologyPage } from '../pages/patient/PatientRadiologyPage';
import { DoctorRadiologyPage } from '../pages/clinical/DoctorRadiologyPage';

// Module 24: Housekeeping Management Pages
import {
  HousekeepingDashboard,
  HousekeepingTasks,
  RoomTurnover,
  HousekeepingAreas,
  HousekeepingSchedules,
  HousekeepingChecklists,
  HousekeepingInspections,
  HousekeepingSupplies,
  HousekeepingExceptions,
  HousekeepingAnalytics
} from '../pages/operations/housekeeping';

// Module 23: Maintenance Management Pages
import {
  MaintenanceDashboard,
  Assets as MaintenanceAssets,
  AssetDetails as MaintenanceAssetDetails,
  MaintenanceRequests,
  WorkOrders as MaintenanceWorkOrders,
  WorkOrderDetails as MaintenanceWorkOrderDetails,
  MaintenanceCalendar,
  PreventiveMaintenance,
  Checklists as MaintenanceChecklists,
  PartsRequests as MaintenancePartsRequests,
  Contracts as MaintenanceContracts,
  Calibrations as MaintenanceCalibrations,
  MaintenanceExceptions,
} from '../pages/operations/maintenance';

// Module 25: Patient Feedback & Grievances Pages
import {
  FeedbackHome,
  SubmitFeedback,
  MyFeedback,
  PatientFeedbackDetails
} from '../pages/patient/feedback';
import {
  FeedbackDashboard,
  FeedbackList,
  OperationsFeedbackDetails,
  FeedbackReports
} from '../pages/operations/feedback';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<OnlineRegistrationPage />} />
      <Route path="/register/success" element={<RegistrationSuccessPage />} />

      {/* Authenticated Portal Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Portal-specific Dashboard Aliases */}
        <Route path="patient/dashboard" element={<Dashboard />} />
        <Route path="clinical/dashboard" element={<Dashboard />} />
        <Route path="operations/dashboard" element={<Dashboard />} />
        <Route path="finance/dashboard" element={<Dashboard />} />
        <Route path="admin/dashboard" element={<Dashboard />} />

        {/* Module 1: Patient Self-Service Portal Routes */}
        <Route
          path="patient/profile"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/visits"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientVisitsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/appointments"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientAppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/appointments/book"
          element={
            <ProtectedRoute>
              <BookAppointmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/check-in"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientOnlineCheckInPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/checkin"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientOnlineCheckInPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/queue"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientLiveQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/queue/:tokenId"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientLiveQueuePage />
            </ProtectedRoute>
          }
        />
        {/* Module 4: Patient Portal Admissions */}
        <Route
          path="patient/admissions"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientAdmissionsPage />
            </ProtectedRoute>
          }
        />
        {/* Module 6: Patient Portal Discharge & Bills */}
        <Route
          path="patient/discharges"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientDischargesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/discharges/:id"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientDischargesPage />
            </ProtectedRoute>
          }
        />
        {/* Module 8: Patient Portal Bills & Payments */}
        <Route
          path="patient/bills"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientBillsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="portal/billing"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientBillsPage />
            </ProtectedRoute>
          }
        />
        {/* Module 7: Patient Records Portal View */}
        <Route
          path="patient/records"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientRecordsPage />
            </ProtectedRoute>
          }
        />
        {/* Module 9: Patient Insurance Self-Service */}
        <Route
          path="patient/insurance"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientInsurancePage />
            </ProtectedRoute>
          }
        />
        {/* Module 10: Patient Claims Self-Service */}
        <Route
          path="patient/claims"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientClaimsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/insurance/claims"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientClaimsPage />
            </ProtectedRoute>
          }
        />

        {/* Module 21: Patient Portal Diagnostic Lab Reports */}
        <Route
          path="patient/laboratory"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientLabPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/lab-reports"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientLabPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/lab"
          element={<Navigate to="/patient/laboratory" replace />}
        />

        {/* Module 22: Patient Portal Diagnostic Radiology Reports & Schedules */}
        <Route
          path="patient/radiology"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientRadiologyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/radiology-reports"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientRadiologyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/imaging"
          element={<Navigate to="/patient/radiology" replace />}
        />

        {/* Module 25: Patient Feedback & Grievance Routes */}
        <Route
          path="patient/feedback"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <FeedbackHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/feedback/new"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <SubmitFeedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/feedback/my"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <MyFeedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/feedback/:feedbackId"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientFeedbackDetails />
            </ProtectedRoute>
          }
        />

        {/* Module 2 & 3: Clinical Portal Appointments & OPD Queue */}
        <Route
          path="clinical/appointments"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'SYSTEM_ADMIN']}>
              <DoctorAppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="clinical/opd-queue"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <DoctorOpdQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="clinical/opd"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <DoctorOpdQueuePage />
            </ProtectedRoute>
          }
        />
        {/* Module 4: Clinical Admission Orders */}
        <Route
          path="clinical/admissions"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <DoctorAdmissionRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="clinical/admission-requests"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <DoctorAdmissionRequestPage />
            </ProtectedRoute>
          }
        />
        {/* Module 6: Clinical Discharge Orders */}
        <Route
          path="clinical/discharges"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <DoctorDischargePage />
            </ProtectedRoute>
          }
        />

        {/* Module 4 & 5: Operations & Bed Management Routes */}
        <Route
          path="operations/admissions"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'DOCTOR']}>
              <OperationsAdmissionsPage />
            </ProtectedRoute>
          }
        />
        {/* Module 6: Operations Discharge Processing */}
        <Route
          path="operations/discharges"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'BILLING_STAFF', 'DOCTOR']}>
              <OperationsDischargesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/discharges/:id"
          element={
            <ProtectedRoute>
              <DischargeDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="discharges"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'BILLING_STAFF', 'DOCTOR']}>
              <OperationsDischargesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="discharges/:id"
          element={
            <ProtectedRoute>
              <DischargeDetailPage />
            </ProtectedRoute>
          }
        />
        {/* Module 8: Staff Billing & Financial Desk */}
        <Route
          path="finance/billing"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <BillingManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="billing"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <BillingManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/billing"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <BillingManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="billing/invoices/:id"
          element={
            <ProtectedRoute>
              <InvoiceDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/billing/invoices/:id"
          element={
            <ProtectedRoute>
              <InvoiceDetailPage />
            </ProtectedRoute>
          }
        />
        {/* Module 9: Insurance Verification & Policy Management */}
        <Route
          path="finance/insurance"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <InsuranceDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="insurance"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <InsuranceDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance-insurance/insurance"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <InsuranceDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/insurance"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <InsuranceDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/verifications/:verificationId"
          element={
            <ProtectedRoute>
              <VerificationDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="verifications/:verificationId"
          element={
            <ProtectedRoute>
              <VerificationDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/patients/:patientId/insurance"
          element={
            <ProtectedRoute>
              <OperationsPatientInsurancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/patients/:patientId/insurance"
          element={
            <ProtectedRoute>
              <OperationsPatientInsurancePage />
            </ProtectedRoute>
          }
        />
        {/* Module 10: Insurance Claims Management */}
        <Route
          path="finance/claims"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <ClaimsDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="claims"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <ClaimsDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance-insurance/claims"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <ClaimsDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/claims/create"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']}>
              <ClaimCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance-insurance/claims/create"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']}>
              <ClaimCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/claims/:id"
          element={
            <ProtectedRoute>
              <ClaimDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance-insurance/claims/:id"
          element={
            <ProtectedRoute>
              <ClaimDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="claims/:id"
          element={
            <ProtectedRoute>
              <ClaimDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="finance/discharges"
          element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']}>
              <OperationsDischargesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/beds"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'HOUSEKEEPING', 'MAINTENANCE', 'DOCTOR']}>
              <BedManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="beds"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'HOUSEKEEPING', 'MAINTENANCE', 'DOCTOR']}>
              <BedManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="beds/:id"
          element={
            <ProtectedRoute>
              <BedDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/beds/:id"
          element={
            <ProtectedRoute>
              <BedDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/admissions/requests"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'DOCTOR']}>
              <OperationsAdmissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/admissions/emergency"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'DOCTOR']}>
              <OperationsAdmissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/admissions/:id"
          element={
            <ProtectedRoute>
              <AdmissionDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/admissions"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'DOCTOR']}>
              <OperationsAdmissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/opd-desk"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']}>
              <OperationsOpdQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/opd-queue"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']}>
              <OperationsOpdQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/opd/queues"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']}>
              <OperationsOpdQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/opd"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']}>
              <OperationsOpdQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/appointments"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']}>
              <OperationsAppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/appointments"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']}>
              <OperationsAppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/registration"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <FrontDeskRegistrationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/registration"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <FrontDeskRegistrationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/patients/search"
          element={
            <ProtectedRoute>
              <PatientSearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/patients/:patientId"
          element={
            <ProtectedRoute>
              <PatientDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/patients/:patientId/records"
          element={
            <ProtectedRoute>
              <PatientRecordsManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/patient-records"
          element={
            <ProtectedRoute>
              <PatientRecordsManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/patient-records/:id"
          element={
            <ProtectedRoute>
              <PatientRecordsManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patients/:patientId/records"
          element={
            <ProtectedRoute>
              <PatientRecordsManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/registrations"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']}>
              <RegistrationsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/identity-review"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <IdentityReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/emergency-registration"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'DOCTOR', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <EmergencyRegistrationPage />
            </ProtectedRoute>
          }
        />

        {/* Administrative & Cross-Module Platform Centers */}
        <Route
          path="admin/rpa"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <RpaDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/exceptions"
          element={
            <ProtectedRoute>
              <ExceptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/config"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER']}>
              <HospitalConfigPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER']}>
              <UsersMasterPage />
            </ProtectedRoute>
          }
        />

        {/* Module 11: Doctor Management & Administrative Master */}
        <Route
          path="admin/doctors"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR', 'RECEPTIONIST']}>
              <DoctorListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="administration/doctors"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR', 'RECEPTIONIST']}>
              <DoctorListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/doctors/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <DoctorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="administration/doctors/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <DoctorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/doctors/new"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER']}>
              <DoctorCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="administration/doctors/new"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER']}>
              <DoctorCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/doctors/availability"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR', 'RECEPTIONIST']}>
              <DoctorAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="administration/doctors/availability"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR', 'RECEPTIONIST']}>
              <DoctorAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/doctors/:doctorId"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR', 'RECEPTIONIST']}>
              <DoctorDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="administration/doctors/:doctorId"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR', 'RECEPTIONIST']}>
              <DoctorDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/doctors/:doctorId/schedule"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR']}>
              <DoctorScheduleCalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="administration/doctors/:doctorId/schedule"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR']}>
              <DoctorScheduleCalendarPage />
            </ProtectedRoute>
          }
        />

        {/* Employee Self-Service Profile */}
        <Route
          path="employee/profile"
          element={
            <ProtectedRoute>
              <StaffSelfProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Module 12: Staff Management Administration Routes */}
        <Route
          path="admin/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <StaffDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="administration/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <StaffDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/staff"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <StaffListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="administration/staff"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <StaffListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/staff/new"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER']}>
              <StaffCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="administration/staff/new"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER']}>
              <StaffCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/staff/access-requests"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER']}>
              <StaffAccessRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/staff/:employeeId"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <StaffDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="administration/staff/:employeeId"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <StaffDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Module 13: Attendance Management Administration Routes */}
        <Route
          path="admin/attendance/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <AttendanceDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <AttendanceDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <AttendanceDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/attendance/daily"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <DailyAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance/daily"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <DailyAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/attendance/import"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER']}>
              <AttendanceImportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance/import"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER']}>
              <AttendanceImportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/attendance/corrections"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <AttendanceCorrectionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance/corrections"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <AttendanceCorrectionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/attendance/reconciliation"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <AttendanceReconciliationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance/reconciliation"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <AttendanceReconciliationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/attendance/reports"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <AttendanceReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance/reports"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <AttendanceReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/attendance/:id"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <AttendanceDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance/:id"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']}>
              <AttendanceDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Employee Self-Service Attendance Routes */}
        <Route
          path="employee/attendance"
          element={
            <ProtectedRoute>
              <MyAttendancePage />
            </ProtectedRoute>
          }
        />
        {/* Module 14: Shift Management Routes */}
        <Route
          path="shifts"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'SUPERVISOR', 'RECEPTIONIST']}>
              <ShiftDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="shifts/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'SUPERVISOR']}>
              <ShiftDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/shifts"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'SUPERVISOR']}>
              <ShiftDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="shifts/definitions"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER']}>
              <ShiftDefinitionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="shifts/rosters"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'SUPERVISOR', 'RECEPTIONIST']}>
              <RosterCalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="shifts/conflicts"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'SUPERVISOR']}>
              <ShiftConflictsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="shifts/requests"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'SUPERVISOR']}>
              <ShiftRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="shifts/reports"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'SUPERVISOR']}>
              <ShiftReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Employee Self-Service Schedule Routes */}
        <Route
          path="my-schedule"
          element={
            <ProtectedRoute>
              <MySchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="employee/schedule"
          element={
            <ProtectedRoute>
              <MySchedulePage />
            </ProtectedRoute>
          }
        />

        {/* Module 15: Leave Management Routes */}
        <Route
          path="leave"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'SUPERVISOR']}>
              <LeaveDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="leave/my-leave"
          element={
            <ProtectedRoute>
              <MyLeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="leave/request"
          element={
            <ProtectedRoute>
              <LeaveRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="leave/approvals"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'SUPERVISOR']}>
              <LeaveApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="leave/calendar"
          element={
            <ProtectedRoute>
              <LeaveCalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="leave/policies"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER']}>
              <LeavePoliciesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="leave/reports"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'SUPERVISOR']}>
              <LeaveReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Employee Self-Service Leave Aliases */}
        <Route
          path="my-leave"
          element={
            <ProtectedRoute>
              <MyLeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-leave/request"
          element={
            <ProtectedRoute>
              <LeaveRequestPage />
            </ProtectedRoute>
          }
        />

        {/* Module 16: Payroll Support Routes */}
        <Route
          path="payroll"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'FINANCE_HEAD', 'PAYROLL_STAFF']}>
              <PayrollDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="payroll/periods"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'FINANCE_HEAD', 'PAYROLL_STAFF']}>
              <PayrollPeriodsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payroll/review"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'FINANCE_HEAD', 'PAYROLL_STAFF']}>
              <PayrollReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payroll/results"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'FINANCE_HEAD', 'PAYROLL_STAFF']}>
              <PayrollResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payroll/salary-config"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'FINANCE_HEAD']}>
              <PayrollSalaryConfigPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payroll/exceptions"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'FINANCE_HEAD', 'PAYROLL_STAFF']}>
              <PayrollExceptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payroll/reports"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER', 'HOSPITAL_MANAGEMENT', 'FINANCE_HEAD', 'PAYROLL_STAFF']}>
              <PayrollReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Employee Self-Service Payroll Routes & Aliases */}
        <Route
          path="my-payroll"
          element={
            <ProtectedRoute>
              <MyPayrollPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-payslips"
          element={
            <ProtectedRoute>
              <PayslipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-payroll/queries"
          element={
            <ProtectedRoute>
              <PayrollQueriesPage />
            </ProtectedRoute>
          }
        />

        {/* Module 17: Pharmacy Management Routes */}
        <Route
          path="operations/pharmacy"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'PHARMACY_TECHNICIAN', 'PHARMACY_ASSISTANT', 'DOCTOR', 'NURSE']}>
              <PharmacyDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/pharmacy/medicines"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'PHARMACY_TECHNICIAN', 'PHARMACY_ASSISTANT']}>
              <MedicineCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/pharmacy/prescriptions"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'DOCTOR', 'NURSE']}>
              <PrescriptionQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/pharmacy/orders"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'PHARMACY_TECHNICIAN', 'PHARMACY_ASSISTANT', 'NURSE']}>
              <PharmacyOrderQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/pharmacy/dispensing"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'PHARMACY_TECHNICIAN']}>
              <DispensingConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/pharmacy/dispensing-history"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'PHARMACY_TECHNICIAN', 'DOCTOR']}>
              <DispensingHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/pharmacy/returns"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST']}>
              <PharmacyReturnsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/pharmacy/alerts"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'PHARMACY_TECHNICIAN']}>
              <PharmacyAlertsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/pharmacy/reports"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'FINANCE_HEAD']}>
              <PharmacyReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Pharmacy Route Aliases */}
        <Route path="pharmacy" element={<Navigate to="/operations/pharmacy" replace />} />
        <Route path="pharmacy/dashboard" element={<Navigate to="/operations/pharmacy" replace />} />
        <Route path="pharmacy/medicines" element={<Navigate to="/operations/pharmacy/medicines" replace />} />
        <Route path="pharmacy/prescriptions" element={<Navigate to="/operations/pharmacy/prescriptions" replace />} />
        <Route path="pharmacy/orders" element={<Navigate to="/operations/pharmacy/orders" replace />} />
        <Route path="pharmacy/dispensing" element={<Navigate to="/operations/pharmacy/dispensing" replace />} />
        <Route path="pharmacy/dispensing-history" element={<Navigate to="/operations/pharmacy/dispensing-history" replace />} />
        <Route path="pharmacy/returns" element={<Navigate to="/operations/pharmacy/returns" replace />} />
        <Route path="pharmacy/alerts" element={<Navigate to="/operations/pharmacy/alerts" replace />} />
        <Route path="pharmacy/reports" element={<Navigate to="/operations/pharmacy/reports" replace />} />

        {/* Patient Pharmacy Portal */}
        <Route
          path="patient/pharmacy"
          element={
            <ProtectedRoute>
              <PatientPharmacyPage />
            </ProtectedRoute>
          }
        />

        {/* ======================================================== */}
        {/* Module 18: Medical Inventory Management Routes */}
        {/* ======================================================== */}
        <Route
          path="operations/inventory"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'NURSE', 'DOCTOR', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'PROCUREMENT_OFFICER']}>
              <InventoryDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'NURSE', 'DOCTOR', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'PROCUREMENT_OFFICER']}>
              <InventoryDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/items"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'NURSE', 'DOCTOR', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'PROCUREMENT_OFFICER']}>
              <InventoryItemsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/items/:id"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'NURSE', 'DOCTOR', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'PROCUREMENT_OFFICER']}>
              <InventoryItemDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/batches"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'PROCUREMENT_OFFICER']}>
              <BatchManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/locations"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'PROCUREMENT_OFFICER']}>
              <StockLocationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/goods-receipts"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'PROCUREMENT_OFFICER']}>
              <GoodsReceiptPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/transfers"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'PROCUREMENT_OFFICER', 'NURSE']}>
              <StockTransfersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/adjustments"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'PROCUREMENT_OFFICER']}>
              <StockAdjustmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/stock-counts"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'AUDITOR']}>
              <StockCountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/reconciliations"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'AUDITOR']}>
              <ReconciliationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/alerts"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'NURSE', 'DOCTOR']}>
              <InventoryAlertsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/inventory/reports"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST', 'SENIOR_PHARMACIST', 'HEAD_OF_PHARMACY', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'AUDITOR']}>
              <InventoryReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Inventory Route Aliases */}
        <Route path="inventory" element={<Navigate to="/operations/inventory" replace />} />
        <Route path="inventory/dashboard" element={<Navigate to="/operations/inventory" replace />} />
        <Route path="inventory/items" element={<Navigate to="/operations/inventory/items" replace />} />
        <Route path="inventory/items/:id" element={<Navigate to="/operations/inventory/items/:id" replace />} />
        <Route path="inventory/batches" element={<Navigate to="/operations/inventory/batches" replace />} />
        <Route path="inventory/locations" element={<Navigate to="/operations/inventory/locations" replace />} />
        <Route path="inventory/goods-receipts" element={<Navigate to="/operations/inventory/goods-receipts" replace />} />
        <Route path="inventory/transfers" element={<Navigate to="/operations/inventory/transfers" replace />} />
        <Route path="inventory/adjustments" element={<Navigate to="/operations/inventory/adjustments" replace />} />
        <Route path="inventory/stock-counts" element={<Navigate to="/operations/inventory/stock-counts" replace />} />
        <Route path="inventory/reconciliations" element={<Navigate to="/operations/inventory/reconciliations" replace />} />
        <Route path="inventory/alerts" element={<Navigate to="/operations/inventory/alerts" replace />} />
        <Route path="inventory/reports" element={<Navigate to="/operations/inventory/reports" replace />} />

        {/* Module 19: Procurement Management */}
        <Route
          path="operations/procurement"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'STORE_KEEPER', 'DOCTOR', 'NURSE', 'HEAD_OF_PHARMACY', 'PHARMACIST', 'AUDITOR']}>
              <ProcurementDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'STORE_KEEPER', 'DOCTOR', 'NURSE', 'HEAD_OF_PHARMACY', 'PHARMACIST', 'AUDITOR']}>
              <ProcurementDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/requests"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'STORE_KEEPER', 'DOCTOR', 'NURSE', 'HEAD_OF_PHARMACY', 'PHARMACIST', 'AUDITOR']}>
              <PurchaseRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/requests/:id"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'STORE_KEEPER', 'DOCTOR', 'NURSE', 'HEAD_OF_PHARMACY', 'PHARMACIST', 'AUDITOR']}>
              <PurchaseRequestDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/approvals"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'FINANCE_HEAD', 'HEAD_OF_PHARMACY', 'AUDITOR']}>
              <ApprovalQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/rfqs"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'STORE_KEEPER', 'AUDITOR']}>
              <RfqsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/quotations"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'AUDITOR']}>
              <QuotationManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/comparisons"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'FINANCE_HEAD', 'AUDITOR']}>
              <QuotationComparisonPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/purchase-orders"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'STORE_KEEPER', 'AUDITOR']}>
              <PurchaseOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/purchase-orders/:id"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'STORE_KEEPER', 'AUDITOR']}>
              <PurchaseOrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/deliveries"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'AUDITOR']}>
              <DeliveryTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/invoices"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'FINANCE_HEAD', 'AUDITOR']}>
              <InvoiceMatchingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/exceptions"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'FINANCE_HEAD', 'AUDITOR']}>
              <ProcurementExceptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/procurement/reports"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'FINANCE_HEAD', 'AUDITOR']}>
              <ProcurementReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Procurement Route Aliases */}
        <Route path="procurement" element={<Navigate to="/operations/procurement" replace />} />
        <Route path="procurement/dashboard" element={<Navigate to="/operations/procurement" replace />} />
        <Route path="procurement/requests" element={<Navigate to="/operations/procurement/requests" replace />} />
        <Route path="procurement/requests/:id" element={<Navigate to="/operations/procurement/requests/:id" replace />} />
        <Route path="procurement/approvals" element={<Navigate to="/operations/procurement/approvals" replace />} />
        <Route path="procurement/rfqs" element={<Navigate to="/operations/procurement/rfqs" replace />} />
        <Route path="procurement/quotations" element={<Navigate to="/operations/procurement/quotations" replace />} />
        <Route path="procurement/comparisons" element={<Navigate to="/operations/procurement/comparisons" replace />} />
        <Route path="procurement/purchase-orders" element={<Navigate to="/operations/procurement/purchase-orders" replace />} />
        <Route path="procurement/purchase-orders/:id" element={<Navigate to="/operations/procurement/purchase-orders/:id" replace />} />
        <Route path="procurement/deliveries" element={<Navigate to="/operations/procurement/deliveries" replace />} />
        <Route path="procurement/invoices" element={<Navigate to="/operations/procurement/invoices" replace />} />
        <Route path="procurement/exceptions" element={<Navigate to="/operations/procurement/exceptions" replace />} />
        <Route path="procurement/reports" element={<Navigate to="/operations/procurement/reports" replace />} />

        {/* Module 20: Vendor Management Routes */}
        <Route
          path="operations/vendors"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'AUDITOR']}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/vendors/list"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'AUDITOR']}>
              <VendorList />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/vendors/new"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER']}>
              <VendorRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/vendors/:id"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'AUDITOR']}>
              <VendorDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/vendors/documents"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'FINANCE_HEAD', 'AUDITOR']}>
              <VendorDocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/vendors/contracts"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'FINANCE_HEAD', 'AUDITOR']}>
              <VendorContractsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/vendors/issues"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'INVENTORY_MANAGER', 'FINANCE_HEAD', 'AUDITOR']}>
              <VendorIssuesPage />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Vendor Self-Service Portal */}
        <Route
          path="vendor"
          element={
            <ProtectedRoute allowedRoles={['VENDOR', 'SYSTEM_ADMIN', 'PROCUREMENT_OFFICER']}>
              <VendorPortalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="vendor/portal"
          element={
            <ProtectedRoute allowedRoles={['VENDOR', 'SYSTEM_ADMIN', 'PROCUREMENT_OFFICER']}>
              <VendorPortalPage />
            </ProtectedRoute>
          }
        />

        {/* Vendor Route Aliases */}
        <Route path="vendors" element={<Navigate to="/operations/vendors" replace />} />
        <Route path="vendors/dashboard" element={<Navigate to="/operations/vendors" replace />} />
        <Route path="vendors/list" element={<Navigate to="/operations/vendors/list" replace />} />
        <Route path="vendors/new" element={<Navigate to="/operations/vendors/new" replace />} />
        <Route path="vendors/:id" element={<Navigate to="/operations/vendors/:id" replace />} />
        <Route path="vendors/documents" element={<Navigate to="/operations/vendors/documents" replace />} />
        <Route path="vendors/contracts" element={<Navigate to="/operations/vendors/contracts" replace />} />
        <Route path="vendors/issues" element={<Navigate to="/operations/vendors/issues" replace />} />

        {/* Module 21: Laboratory Administration Routes */}
        <Route
          path="operations/laboratory"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'DOCTOR', 'NURSE', 'HOSPITAL_MANAGEMENT']}>
              <LaboratoryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'DOCTOR', 'NURSE', 'HOSPITAL_MANAGEMENT']}>
              <LaboratoryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/tests"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'DOCTOR']}>
              <LabTests />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/orders"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'DOCTOR', 'NURSE']}>
              <LabOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/orders/:id"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'DOCTOR', 'NURSE']}>
              <LabOrderDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/collections"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'NURSE', 'PHLEBOTOMIST', 'PATHOLOGIST']}>
              <CollectionQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/reception"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST']}>
              <SampleReception />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/processing"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST']}>
              <ProcessingQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/results/entry"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST']}>
              <ResultEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/verification"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'PATHOLOGIST', 'DOCTOR', 'LAB_TECHNICIAN']}>
              <VerificationQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/reports"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'DOCTOR', 'NURSE']}>
              <LabReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/rejected-samples"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'NURSE']}>
              <RejectedSamples />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/exceptions"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST']}>
              <LabExceptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/laboratory/analytics"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'HOSPITAL_MANAGEMENT']}>
              <LabAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Laboratory Route Aliases */}
        <Route path="laboratory" element={<Navigate to="/operations/laboratory" replace />} />
        <Route path="laboratory/orders" element={<Navigate to="/operations/laboratory/orders" replace />} />
        <Route path="laboratory/reports" element={<Navigate to="/operations/laboratory/reports" replace />} />
        <Route path="clinical/lab-orders" element={<Navigate to="/operations/laboratory/orders" replace />} />

        {/* Module 22: Radiology Administration Operations Routes */}
        <Route
          path="operations/radiology"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RADIOLOGY_TECHNICIAN', 'HOSPITAL_MANAGEMENT', 'DOCTOR']}>
              <RadiologyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/radiology/exams"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RADIOLOGY_TECHNICIAN', 'DOCTOR']}>
              <RadiologyExams />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/radiology/modalities"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RADIOLOGY_TECHNICIAN']}>
              <Modalities />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/radiology/orders"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RADIOLOGY_TECHNICIAN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']}>
              <RadiologyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/radiology/scheduling"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RADIOLOGY_TECHNICIAN', 'RECEPTIONIST']}>
              <RadiologyScheduling />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/radiology/check-in"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RADIOLOGY_TECHNICIAN', 'RECEPTIONIST']}>
              <PatientCheckIn />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/radiology/procedure-queue"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RADIOLOGY_TECHNICIAN']}>
              <ProcedureQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/radiology/studies"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RADIOLOGY_TECHNICIAN', 'DOCTOR']}>
              <Studies />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/radiology/reporting-queue"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'DOCTOR', 'RADIOLOGY_TECHNICIAN']}>
              <ReportingQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/radiology/reports"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'DOCTOR', 'RADIOLOGY_TECHNICIAN', 'NURSE']}>
              <RadiologyReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/radiology/exceptions"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RADIOLOGY_TECHNICIAN']}>
              <RadiologyExceptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/radiology/analytics"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RADIOLOGY_TECHNICIAN', 'HOSPITAL_MANAGEMENT']}>
              <RadiologyAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Clinical Doctor Radiology Portal Route */}
        <Route
          path="clinical/radiology"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'SYSTEM_ADMIN', 'ADMIN_MANAGER']}>
              <DoctorRadiologyPage />
            </ProtectedRoute>
          }
        />

        {/* Radiology Route Aliases */}
        <Route path="radiology" element={<Navigate to="/operations/radiology" replace />} />
        <Route path="radiology/orders" element={<Navigate to="/operations/radiology/orders" replace />} />
        <Route path="radiology/reports" element={<Navigate to="/operations/radiology/reports" replace />} />
        <Route path="radiology/schedules" element={<Navigate to="/operations/radiology/scheduling" replace />} />
        <Route path="clinical/radiology-orders" element={<Navigate to="/clinical/radiology" replace />} />

        {/* Module 24: Housekeeping Management Routes */}
        <Route
          path="operations/housekeeping"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOUSEKEEPING', 'NURSE', 'HOSPITAL_MANAGEMENT']}>
              <HousekeepingDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/housekeeping/tasks"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOUSEKEEPING', 'NURSE']}>
              <HousekeepingTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/housekeeping/turnover"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOUSEKEEPING', 'NURSE']}>
              <RoomTurnover />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/housekeeping/areas"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOUSEKEEPING']}>
              <HousekeepingAreas />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/housekeeping/schedules"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOUSEKEEPING']}>
              <HousekeepingSchedules />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/housekeeping/checklists"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOUSEKEEPING']}>
              <HousekeepingChecklists />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/housekeeping/inspections"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOUSEKEEPING', 'NURSE']}>
              <HousekeepingInspections />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/housekeeping/supplies"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOUSEKEEPING']}>
              <HousekeepingSupplies />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/housekeeping/exceptions"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOUSEKEEPING', 'NURSE']}>
              <HousekeepingExceptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/housekeeping/analytics"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOUSEKEEPING', 'HOSPITAL_MANAGEMENT']}>
              <HousekeepingAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Housekeeping Route Aliases */}
        <Route path="housekeeping" element={<Navigate to="/operations/housekeeping" replace />} />
        <Route path="housekeeping/tasks" element={<Navigate to="/operations/housekeeping/tasks" replace />} />
        <Route path="housekeeping/turnover" element={<Navigate to="/operations/housekeeping/turnover" replace />} />
        <Route path="housekeeping/schedules" element={<Navigate to="/operations/housekeeping/schedules" replace />} />
        <Route path="housekeeping/inspections" element={<Navigate to="/operations/housekeeping/inspections" replace />} />
        <Route path="housekeeping/analytics" element={<Navigate to="/operations/housekeeping/analytics" replace />} />

        {/* Module 23: Maintenance Management Routes */}
        <Route
          path="operations/maintenance"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST', 'DOCTOR', 'NURSE']}>
              <MaintenanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/assets"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE', 'HOSPITAL_MANAGEMENT']}>
              <MaintenanceAssets />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/assets/:id"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE', 'HOSPITAL_MANAGEMENT']}>
              <MaintenanceAssetDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/requests"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'HOSPITAL_MANAGEMENT']}>
              <MaintenanceRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/work-orders"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE', 'HOSPITAL_MANAGEMENT']}>
              <MaintenanceWorkOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/work-orders/:id"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE', 'HOSPITAL_MANAGEMENT']}>
              <MaintenanceWorkOrderDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/calendar"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE']}>
              <MaintenanceCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/preventive"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE']}>
              <PreventiveMaintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/checklists"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE']}>
              <MaintenanceChecklists />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/parts"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE', 'PROCUREMENT_OFFICER']}>
              <MaintenancePartsRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/contracts"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE', 'PROCUREMENT_OFFICER']}>
              <MaintenanceContracts />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/calibrations"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE']}>
              <MaintenanceCalibrations />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/exceptions"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE']}>
              <MaintenanceExceptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/maintenance/analytics"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'MAINTENANCE', 'HOSPITAL_MANAGEMENT']}>
              <MaintenanceAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Maintenance Route Aliases */}
        <Route path="maintenance" element={<Navigate to="/operations/maintenance" replace />} />
        <Route path="maintenance/assets" element={<Navigate to="/operations/maintenance/assets" replace />} />
        <Route path="maintenance/requests" element={<Navigate to="/operations/maintenance/requests" replace />} />
        <Route path="maintenance/work-orders" element={<Navigate to="/operations/maintenance/work-orders" replace />} />
        <Route path="maintenance/calendar" element={<Navigate to="/operations/maintenance/calendar" replace />} />
        <Route path="maintenance/preventive" element={<Navigate to="/operations/maintenance/preventive" replace />} />
        <Route path="maintenance/analytics" element={<Navigate to="/operations/maintenance/analytics" replace />} />

        {/* Module 25: Operations Feedback & Grievance Hub */}
        <Route
          path="operations/feedback"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'GRIEVANCE_OFFICER']}>
              <FeedbackDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/feedback/list"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'GRIEVANCE_OFFICER']}>
              <FeedbackList />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/feedback/reports"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'GRIEVANCE_OFFICER']}>
              <FeedbackReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/feedback/:feedbackId"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'GRIEVANCE_OFFICER']}>
              <OperationsFeedbackDetails />
            </ProtectedRoute>
          }
        />

        {/* Feedback Route Aliases */}
        <Route path="feedback" element={<Navigate to="/operations/feedback" replace />} />
        <Route path="feedback/reports" element={<Navigate to="/operations/feedback/reports" replace />} />
        <Route path="feedback/list" element={<Navigate to="/operations/feedback/list" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
