const CalibrationService = require('../../services/maintenance/calibrationService');

exports.createCalibration = async (req, res, next) => {
  try {
    const record = await CalibrationService.createCalibration(req.body, req.user?._id || req.user?.id);
    res.status(201).json({
      success: true,
      data: record,
      message: 'Calibration record logged'
    });
  } catch (err) {
    next(err);
  }
};

exports.getCalibrations = async (req, res, next) => {
  try {
    const result = await CalibrationService.getCalibrations(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

exports.getCalibrationById = async (req, res, next) => {
  try {
    const record = await CalibrationService.getCalibrationById(req.params.id);
    res.json({
      success: true,
      data: record
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCalibration = async (req, res, next) => {
  try {
    const record = await CalibrationService.updateCalibration(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: record,
      message: 'Calibration record updated'
    });
  } catch (err) {
    next(err);
  }
};

exports.completeCalibration = async (req, res, next) => {
  try {
    const record = await CalibrationService.updateCalibration(
      req.params.id,
      { ...req.body, status: 'COMPLETED' },
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: record,
      message: 'Calibration marked complete'
    });
  } catch (err) {
    next(err);
  }
};

