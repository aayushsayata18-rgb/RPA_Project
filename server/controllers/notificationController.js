const Notification = require('../models/Notification');
const NotificationService = require('../services/NotificationService');

// @desc    Get In-App notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const notifications = await NotificationService.getUserNotifications(
      req.user.userId,
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
// @route   PUT /api/notifications/:notificationId/read
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

// @desc    Trigger notification (Admin/Service)
// @route   POST /api/notifications/send
// @access  Private
exports.sendNotification = async (req, res, next) => {
  try {
    const { recipientId, recipientPhone, recipientEmail, channel, event, templateCode, title, message, variables } = req.body;

    const notif = await NotificationService.sendNotification({
      recipientId,
      recipientPhone,
      recipientEmail,
      channel,
      event,
      templateCode,
      title,
      message,
      variables
    });

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully.',
      data: notif
    });
  } catch (error) {
    next(error);
  }
};
