const User = require('../models/User');
const AuditService = require('../services/AuditService');

// @desc    Get all users (with filtering and pagination)
// @route   GET /api/users
// @access  Private (Admin / HR)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status / role
// @route   PUT /api/users/:userId
// @access  Private (Admin)
exports.updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role, isActive, customPermissions, linkedEntityId } = req.body;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User ${userId} not found.`,
        errorCode: 'USER_NOT_FOUND'
      });
    }

    const oldState = { role: user.role, isActive: user.isActive };

    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (customPermissions) user.customPermissions = customPermissions;
    if (linkedEntityId !== undefined) user.linkedEntityId = linkedEntityId;

    await user.save();

    await AuditService.logEvent({
      userId: req.user.userId,
      role: req.user.role,
      action: 'USER_UPDATED',
      module: 'USER_MANAGEMENT',
      entityType: 'User',
      entityId: user.userId,
      oldValue: oldState,
      newValue: { role: user.role, isActive: user.isActive },
      details: `User ${user.userId} updated by ${req.user.email}`
    });

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: user
    });
  } catch (error) {
    next(error);
  }
};
