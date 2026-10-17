const Notification = require('../models/Notification');
const NotificationDelivery = require('../models/NotificationDelivery');
const NotificationTemplate = require('../models/NotificationTemplate');
const NotificationCampaign = require('../models/NotificationCampaign');
const NotificationService = require('../services/NotificationService');
const TemplateService = require('../services/templateService');
const PreferenceService = require('../services/preferenceService');
const ReconciliationService = require('../services/reconciliationService');
const CampaignService = require('../services/campaignService');

// @desc    Get In-App notifications for current user
// @route   GET /api/notifications/my
// @access  Private
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const userId = req.user?.userId || req.user?._id;
    const patientId = req.user?.patientId;

    const notifications = await NotificationService.getUserNotifications(
      patientId || userId,
      unreadOnly === 'true'
    );

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   POST /api/notifications/:notificationId/read or PUT /api/notifications/:notificationId/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const updated = await NotificationService.markAsRead(notificationId);
    res.json({
      success: true,
      message: 'Notification marked as read.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create / Trigger notification
// @route   POST /api/notifications
// @access  Private
exports.createNotification = async (req, res, next) => {
  try {
    const notif = await NotificationService.sendNotification(req.body);
    res.status(201).json({
      success: true,
      message: 'Notification processed successfully.',
      data: notif
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Search & List Notifications
// @route   GET /api/notifications
// @access  Private (Admins / Operations)
exports.listNotifications = async (req, res, next) => {
  try {
    const result = await NotificationService.listNotifications(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Notification Details & Delivery Attempts
// @route   GET /api/notifications/:notificationId
// @access  Private
exports.getNotificationDetails = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOne({ notificationId }).lean();
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const deliveries = await NotificationDelivery.find({ notificationId: notification._id })
      .sort({ attemptNumber: 1, createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        ...notification,
        deliveries
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retry failed notification
// @route   POST /api/notifications/:notificationId/retry
// @access  Private (Operations / Admin)
exports.retryNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const { force } = req.body;
    const result = await NotificationService.retryNotification(notificationId, force === true);
    res.json({
      success: true,
      message: 'Notification retry initiated.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel scheduled notification
// @route   POST /api/notifications/:notificationId/cancel
// @access  Private
exports.cancelNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const { reason } = req.body;
    const result = await NotificationService.cancelScheduledNotification(notificationId, reason);
    res.json({
      success: true,
      message: 'Scheduled notification cancelled.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Notification Dashboard Metrics
// @route   GET /api/notifications/dashboard
// @access  Private
exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await NotificationService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Webhook Provider Callback
// @route   POST /api/notifications/webhooks/:provider
// @access  Public (Signature validated)
exports.handleProviderWebhook = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const signature = req.headers['x-provider-signature'] || req.headers['x-hub-signature-256'];
    const result = await ReconciliationService.processWebhookCallback(provider, req.body, signature);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Manual or Worker Status Reconciliation
// @route   POST /api/notifications/reconcile
// @access  Private
exports.reconcileDeliveries = async (req, res, next) => {
  try {
    const { limit } = req.body;
    const result = await ReconciliationService.reconcileDeliveries(limit || 50);
    res.json({
      success: true,
      message: `Reconciled ${result.reconciledCount} deliveries`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Templates
// @route   GET /api/notifications/templates
// @access  Private
exports.getTemplates = async (req, res, next) => {
  try {
    const templates = await NotificationTemplate.find().sort({ templateCode: 1 }).lean();
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update template version
// @route   POST /api/notifications/templates
// @access  Private (Admins)
exports.saveTemplate = async (req, res, next) => {
  try {
    const saved = await TemplateService.saveTemplate({
      ...req.body,
      modifiedBy: req.user?.userId || req.user?.email || 'ADMIN'
    });
    res.status(201).json({
      success: true,
      message: 'Template saved with versioning.',
      data: saved
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve template version
// @route   POST /api/notifications/templates/:id/approve
// @access  Private (Admins)
exports.approveTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approved = await TemplateService.approveTemplate(id, req.user?.email || 'ADMIN');
    res.json({
      success: true,
      message: 'Template version approved.',
      data: approved
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get User Notification Preferences
// @route   GET /api/notifications/preferences
// @access  Private
exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const patientId = req.user?.patientId;

    const NotificationPreference = require('../models/NotificationPreference');
    const prefs = await NotificationPreference.find({
      $or: [
        { userId: String(userId) },
        { patientId: String(patientId) }
      ]
    }).lean();

    res.json({
      success: true,
      data: prefs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Notification Preferences
// @route   PATCH /api/notifications/preferences
// @access  Private
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const patientId = req.user?.patientId;
    const { notificationType, smsEnabled, emailEnabled, inAppEnabled, quietHours } = req.body;

    const filter = { notificationType };
    if (patientId) {
      filter.patientId = String(patientId);
    } else {
      filter.userId = String(userId);
    }

    const updated = await PreferenceService.updatePreferences(filter, {
      smsEnabled,
      emailEnabled,
      inAppEnabled,
      quietHours
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List Bulk Campaigns
// @route   GET /api/notifications/campaigns
// @access  Private
exports.listCampaigns = async (req, res, next) => {
  try {
    const campaigns = await NotificationCampaign.find().sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Campaign with audience preview
// @route   POST /api/notifications/campaigns
// @access  Private (Admins)
exports.createCampaign = async (req, res, next) => {
  try {
    const campaign = await CampaignService.createCampaign({
      ...req.body,
      createdBy: req.user?.email || 'ADMIN'
    });
    res.status(201).json({
      success: true,
      message: 'Bulk campaign created.',
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Preview Campaign Audience Count
// @route   POST /api/notifications/campaigns/preview
// @access  Private
exports.previewAudience = async (req, res, next) => {
  try {
    const preview = await CampaignService.previewAudience(req.body);
    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve Campaign
// @route   POST /api/notifications/campaigns/:id/approve
// @access  Private (Admins)
exports.approveCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approved = await CampaignService.approveCampaign(id, req.user?.email || 'ADMIN');
    res.json({
      success: true,
      message: 'Campaign approved.',
      data: approved
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Execute Campaign
// @route   POST /api/notifications/campaigns/:id/execute
// @access  Private (Admins)
exports.executeCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const executed = await CampaignService.executeCampaign(id, NotificationService);
    res.json({
      success: true,
      message: 'Campaign executed.',
      data: executed
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Detailed Delivery Reports (Section 65-66)
// @route   GET /api/notifications/reports
// @access  Private
exports.getReports = async (req, res, next) => {
  try {
    const totalDeliveries = await NotificationDelivery.countDocuments();
    const statusCounts = await NotificationDelivery.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const channelCounts = await NotificationDelivery.aggregate([
      { $group: { _id: '$channel', count: { $sum: 1 } } }
    ]);
    const failureReasons = await NotificationDelivery.aggregate([
      { $match: { status: 'FAILED' } },
      { $group: { _id: '$errorCode', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalDeliveries,
        byStatus: statusCounts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        byChannel: channelCounts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        failureReasons: failureReasons.map((f) => ({ code: f._id || 'UNKNOWN', count: f.count }))
      }
    });
  } catch (error) {
    next(error);
  }
};
