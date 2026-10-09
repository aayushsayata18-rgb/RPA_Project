const express = require('express');
const router = express.Router();
const OPDController = require('../controllers/opdController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

// Check-in (Online Self Check-in OR Front-Desk Check-in)
router.post('/check-in', optionalAuth, OPDController.checkIn);

// Live Queues
router.get('/queues', protect, OPDController.getQueues);
router.get('/queues/:queueId', protect, OPDController.getQueueById);
router.get('/queues/:queueId/tokens', protect, OPDController.getQueueTokens);

// Tokens Lookup
router.get('/tokens/:tokenId', protect, OPDController.getTokenById);
router.get('/tokens/patient/:patientId', protect, OPDController.getPatientToken);

// Token Lifecycle Transitions
router.post(
  '/tokens/:tokenId/call',
  protect,
  authorizeRoles('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'),
  OPDController.callToken
);

router.post(
  '/tokens/:tokenId/start',
  protect,
  authorizeRoles('DOCTOR', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'),
  OPDController.startService
);

router.post(
  '/tokens/:tokenId/complete',
  protect,
  authorizeRoles('DOCTOR', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'),
  OPDController.completeService
);

router.post(
  '/tokens/:tokenId/skip',
  protect,
  authorizeRoles('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'),
  OPDController.skipToken
);

router.post(
  '/tokens/:tokenId/return',
  protect,
  authorizeRoles('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'),
  OPDController.returnToken
);

router.post(
  '/tokens/:tokenId/transfer',
  protect,
  authorizeRoles('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'),
  OPDController.transferToken
);

router.post(
  '/tokens/:tokenId/cancel',
  protect,
  authorizeRoles('RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'),
  OPDController.cancelToken
);

// Clinical / Operational Priority Assignment
router.post(
  '/tokens/:tokenId/priority',
  protect,
  authorizeRoles('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'),
  OPDController.assignPriority
);

// Queue Lifecycle Management
router.post(
  '/queues/:queueId/pause',
  protect,
  authorizeRoles('DOCTOR', 'RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'),
  OPDController.pauseQueue
);

router.post(
  '/queues/:queueId/resume',
  protect,
  authorizeRoles('DOCTOR', 'RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'),
  OPDController.resumeQueue
);

router.post(
  '/queues/:queueId/close',
  protect,
  authorizeRoles('RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'),
  OPDController.closeQueue
);

// Automated RPA & Administrative Tasks
router.post(
  '/no-show/process',
  protect,
  authorizeRoles('ADMIN_MANAGER', 'RECEPTIONIST', 'SYSTEM_ADMIN', 'RPA_BOT'),
  OPDController.processNoShows
);

router.post(
  '/reconcile',
  protect,
  authorizeRoles('ADMIN_MANAGER', 'SYSTEM_ADMIN', 'RPA_BOT'),
  OPDController.reconcileQueue
);

// Metrics & Analytics
router.get(
  '/reports/stats',
  protect,
  authorizeRoles('ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'SYSTEM_ADMIN', 'RECEPTIONIST', 'DOCTOR'),
  OPDController.getQueueStats
);

module.exports = router;
