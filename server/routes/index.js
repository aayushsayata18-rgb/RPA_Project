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
