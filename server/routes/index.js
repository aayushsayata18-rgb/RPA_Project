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

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/audit', auditRoutes);
router.use('/exceptions', exceptionRoutes);
router.use('/rpa', rpaRoutes);
router.use('/configuration', configRoutes);
router.use('/notifications', notificationRoutes);
router.use('/documents', documentRoutes);

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
