const MaintenanceExceptionService = require('../../services/maintenance/maintenanceExceptionService');

exports.createException = async (req, res, next) => {
  try {
    const ex = await MaintenanceExceptionService.createException(req.body, req.user?._id || req.user?.id);
    res.status(201).json({
      success: true,
      data: ex,
      message: 'Maintenance exception logged'
    });
  } catch (err) {
    next(err);
  }
};

exports.getExceptions = async (req, res, next) => {
  try {
    const result = await MaintenanceExceptionService.getExceptions(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

exports.getExceptionById = async (req, res, next) => {
  try {
    const ex = await MaintenanceExceptionService.getExceptionById(req.params.id);
    res.json({
      success: true,
      data: ex
    });
  } catch (err) {
    next(err);
  }
};

exports.resolveException = async (req, res, next) => {
  try {
    const ex = await MaintenanceExceptionService.resolveException(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: ex,
      message: 'Exception resolved successfully'
    });
  } catch (err) {
    next(err);
  }
};
