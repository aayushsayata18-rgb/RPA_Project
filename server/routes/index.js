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

// Module 2: Appointment Management Routes
const appointmentRoutes = require('./appointmentRoutes');
const doctorRoutes = require('./doctorRoutes');

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
router.use('/registrations', registrationRoutes);
router.use('/visits', visitRoutes);

// Module 2 Endpoints
router.use('/appointments', appointmentRoutes);
router.use('/v1/appointments', appointmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/v1/doctors', doctorRoutes);

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
