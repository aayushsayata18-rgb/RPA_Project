const ExceptionCase = require('../models/ExceptionCase');
const ExceptionService = require('../services/ExceptionService');

// @desc    Get all exception cases
// @route   GET /api/exceptions
// @access  Private (Admin / Management / Staff)
exports.getExceptions = async (req, res, next) => {
  try {
    const { module, currentStatus, severity, assignedRole, page = 1, limit = 20 } = req.query;
    const query = {};

    if (module) query.module = module;
    if (currentStatus) query.currentStatus = currentStatus;
    if (severity) query.severity = severity;
    if (assignedRole) query.assignedRole = assignedRole;

    const skip = (page - 1) * limit;
    const [exceptions, total] = await Promise.all([
      ExceptionCase.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      ExceptionCase.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        exceptions,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve an exception case
// @route   PUT /api/exceptions/:exceptionId/resolve
// @access  Private (Authorized Staff / Admin)
exports.resolveException = async (req, res, next) => {
  try {
    const { exceptionId } = req.params;
    const { resolution } = req.body;

    if (!resolution) {
      return res.status(400).json({
        success: false,
        message: 'Resolution explanation is required.',
        errorCode: 'MISSING_RESOLUTION'
      });
    }

    const resolvedException = await ExceptionService.resolveException({
      exceptionId,
      resolvedBy: req.user.email,
      resolution,
      userId: req.user.userId,
      userRole: req.user.role
    });

    res.json({
      success: true,
      message: 'Exception case resolved successfully.',
      data: resolvedException
    });
  } catch (error) {
    next(error);
  }
};
