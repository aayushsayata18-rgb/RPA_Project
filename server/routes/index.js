const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const auditRoutes = require('./auditRoutes');
const exceptionRoutes = require('./exceptionRoutes');
const rpaRoutes = require('./rpaRoutes');
const configRoutes = require('./configRoutes');
const notificationRoutes = require('./notificationRoutes');
const documentRoutes = require('./documentRoutes');

// Module 1: Patient Registration & Identity Management Routes
const patientRoutes = require('./patientRoutes');
const registrationRoutes = require('./registrationRoutes');
const visitRoutes = require('./visitRoutes');

// Module 7: Patient Records & Longitudinal History Routes
const patientRecordRoutes = require('./patientRecordRoutes');

// Module 2 & 11: Appointment & Doctor Management Routes
const appointmentRoutes = require('./appointmentRoutes');
const doctorRoutes = require('./doctorRoutes');
const doctorScheduleRoutes = require('./doctorScheduleRoutes');
const doctorAvailabilityRoutes = require('./doctorAvailabilityRoutes');

// Module 3: OPD Queue Management Routes
const opdRoutes = require('./opdRoutes');

// Module 4 & 5: Patient Admission & Bed Management Routes
const admissionRoutes = require('./admissionRoutes');
const bedRoutes = require('./bedRoutes');

// Module 6: Discharge Processing, Billing & Payment Routes
const dischargeRoutes = require('./dischargeRoutes');
const dischargeRequestRoutes = require('./dischargeRequestRoutes');
const billingRoutes = require('./billingRoutes');
const paymentRoutes = require('./paymentRoutes');

// Module 9: Insurance Verification Routes
const insuranceRoutes = require('./insuranceRoutes');

// Module 10: Insurance Claims Management Routes
const insuranceClaimRoutes = require('./insuranceClaimRoutes');

// Module 12: Staff Management & Access Provisioning Routes
const employeeRoutes = require('./employeeRoutes');
const accessRequestRoutes = require('./accessRequestRoutes');

// Module 13: Attendance Management Routes
const attendanceRoutes = require('./attendanceRoutes');

// Module 14: Shift Management Routes
const shiftRoutes = require('./shiftRoutes');

// Module 15: Leave Management Routes
const leaveRoutes = require('./leaveRoutes');

// Module 16: Payroll Support Routes
const payrollRoutes = require('./payrollRoutes');

// Module 17: Pharmacy Management Routes
const pharmacyRoutes = require('./pharmacyRoutes');

// Module 18: Medical Inventory Management Routes
const inventoryRoutes = require('./inventoryRoutes');

// Module 19: Procurement Management Routes
const procurementRoutes = require('./procurementRoutes');

// Module 20: Vendor Management Routes
const vendorRoutes = require('./vendorRoutes');

// Module 21: Laboratory Administration Routes
const laboratoryRoutes = require('./laboratoryRoutes');

// Module 22: Radiology Administration Routes
const radiologyRoutes = require('./radiologyRoutes');

// Module 24: Housekeeping Management Routes
const housekeepingRoutes = require('./housekeepingRoutes');

// Module 23: Maintenance Management Routes
const maintenanceRoutes = require('./maintenanceRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/audit', auditRoutes);
router.use('/exceptions', exceptionRoutes);
router.use('/rpa', rpaRoutes);
router.use('/configuration', configRoutes);
router.use('/notifications', notificationRoutes);
router.use('/documents', documentRoutes);

// Module 1 Endpoints
router.use('/patients', patientRoutes);
router.use('/patients', patientRecordRoutes);
router.use('/patient-records', patientRecordRoutes);
router.use('/v1/patient-records', patientRecordRoutes);
router.use('/registrations', registrationRoutes);
router.use('/visits', visitRoutes);

// Module 2 & 11 Endpoints
router.use('/appointments', appointmentRoutes);
router.use('/v1/appointments', appointmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/v1/doctors', doctorRoutes);
router.use('/doctor-schedules', doctorScheduleRoutes);
router.use('/v1/doctor-schedules', doctorScheduleRoutes);
router.use('/doctor-availability', doctorAvailabilityRoutes);
router.use('/v1/doctor-availability', doctorAvailabilityRoutes);

// Module 3 Endpoints
router.use('/opd', opdRoutes);
router.use('/v1/opd', opdRoutes);

// Module 4 & 5 Endpoints
router.use('/admissions', admissionRoutes);
router.use('/v1/admissions', admissionRoutes);
router.use('/admission-requests', admissionRoutes);
router.use('/v1/admission-requests', admissionRoutes);

router.use('/beds', bedRoutes);
router.use('/v1/beds', bedRoutes);
router.use('/wards', bedRoutes);
router.use('/v1/wards', bedRoutes);
router.use('/rooms', bedRoutes);
router.use('/v1/rooms', bedRoutes);
router.use('/accommodation-categories', bedRoutes);
router.use('/v1/accommodation-categories', bedRoutes);
router.use('/bed-reservations', bedRoutes);
router.use('/v1/bed-reservations', bedRoutes);
router.use('/bed-assignments', bedRoutes);
router.use('/v1/bed-assignments', bedRoutes);
router.use('/bed-transfers', bedRoutes);
router.use('/v1/bed-transfers', bedRoutes);
router.use('/housekeeping', bedRoutes);
router.use('/v1/housekeeping', bedRoutes);

// Module 6 Endpoints
router.use('/discharges', dischargeRoutes);
router.use('/v1/discharges', dischargeRoutes);
router.use('/discharge-requests', dischargeRequestRoutes);
router.use('/v1/discharge-requests', dischargeRequestRoutes);
router.use('/billing', billingRoutes);
router.use('/v1/billing', billingRoutes);
router.use('/payments', paymentRoutes);
router.use('/v1/payments', paymentRoutes);

// Module 9 Endpoints
router.use('/insurance', insuranceRoutes);
router.use('/v1/insurance', insuranceRoutes);

// Module 10 Endpoints (Insurance Claims)
router.use('/insurance/claims', insuranceClaimRoutes);
router.use('/v1/insurance/claims', insuranceClaimRoutes);
router.use('/claims', insuranceClaimRoutes);
router.use('/v1/claims', insuranceClaimRoutes);

// Module 12 Endpoints (Staff Management)
router.use('/employees', employeeRoutes);
router.use('/v1/employees', employeeRoutes);
router.use('/access-requests', accessRequestRoutes);
router.use('/v1/access-requests', accessRequestRoutes);

// Module 13 Endpoints (Attendance Management)
router.use('/attendance', attendanceRoutes);
router.use('/v1/attendance', attendanceRoutes);
router.use('/me/attendance', attendanceRoutes);

// Module 14 Endpoints (Shift Management)
router.use('/shifts', shiftRoutes);
router.use('/v1/shifts', shiftRoutes);
router.use('/my-schedule', shiftRoutes);

// Module 15 Endpoints (Leave Management)
router.use('/leave', leaveRoutes);
router.use('/v1/leave', leaveRoutes);
router.use('/me/leave', leaveRoutes);

// Module 16 Endpoints (Payroll Support)
router.use('/payroll', payrollRoutes);
router.use('/v1/payroll', payrollRoutes);
router.use('/me/payroll', payrollRoutes);

// Module 17 Endpoints (Pharmacy Management)
router.use('/pharmacy', pharmacyRoutes);
router.use('/v1/pharmacy', pharmacyRoutes);

// Module 18 Endpoints (Medical Inventory Management)
router.use('/inventory', inventoryRoutes);
router.use('/v1/inventory', inventoryRoutes);

// Module 19 Endpoints (Procurement Management)
router.use('/procurement', procurementRoutes);
router.use('/v1/procurement', procurementRoutes);

// Module 20 Endpoints (Vendor Management)
router.use('/vendors', vendorRoutes);
router.use('/v1/vendors', vendorRoutes);

// Module 21 Endpoints (Laboratory Administration)
router.use('/laboratory', laboratoryRoutes);
router.use('/v1/laboratory', laboratoryRoutes);

// Module 22 Endpoints (Radiology Administration)
router.use('/radiology', radiologyRoutes);
router.use('/v1/radiology', radiologyRoutes);

// Module 24 Endpoints (Housekeeping Management)
router.use('/housekeeping', housekeepingRoutes);
router.use('/v1/housekeeping', housekeepingRoutes);

// Module 23 Endpoints (Maintenance Management)
router.use('/maintenance', maintenanceRoutes);
router.use('/v1/maintenance', maintenanceRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hospital Administrative Platform API is active & healthy.',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
