const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  createNotification,
  listNotifications,
  getNotificationDetails,
  retryNotification,
  cancelNotification,
  getDashboardMetrics,
  handleProviderWebhook,
  reconcileDeliveries,
  getTemplates,
  saveTemplate,
  approveTemplate,
  getPreferences,
  updatePreferences,
  listCampaigns,
  createCampaign,
  previewAudience,
  approveCampaign,
  executeCampaign,
  getReports
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// 1. Provider Webhooks (Public callback endpoint with signature validation)
router.post('/webhooks/:provider', handleProviderWebhook);

// Protected routes
router.use(protect);

// 2. Dashboard & Reporting Metrics
router.get('/dashboard', getDashboardMetrics);
router.get('/reports', getReports);

// 3. User / Patient In-App Notifications
router.get('/my', getMyNotifications);
router.post('/:notificationId/read', markAsRead);
router.put('/:notificationId/read', markAsRead); // backward compatibility

// 4. Preferences
router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);

// 5. Template Management (Section 80)
router.get('/templates', getTemplates);
router.post(
  '/templates',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  saveTemplate
);
router.patch(
  '/templates/:id',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  saveTemplate
);
router.post(
  '/templates/:id/approve',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  approveTemplate
);

// 6. Bulk Campaigns (Section 61-64)
router.get('/campaigns', listCampaigns);
router.post(
  '/campaigns/preview',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  previewAudience
);
router.post(
  '/campaigns',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  createCampaign
);
router.post(
  '/campaigns/:id/approve',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  approveCampaign
);
router.post(
  '/campaigns/:id/execute',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  executeCampaign
);

// 7. Status Reconciliation (Section 79)
router.post(
  '/reconcile',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  reconcileDeliveries
);

// 8. Notification Dispatch & Administrative Management
router.post('/', createNotification);
router.post('/send', createNotification); // backward compatibility
router.get('/', listNotifications);
router.get('/:notificationId', getNotificationDetails);
router.post(
  '/:notificationId/retry',
  authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT),
  retryNotification
);
router.post('/:notificationId/cancel', cancelNotification);

module.exports = router;
