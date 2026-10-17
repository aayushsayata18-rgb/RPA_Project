const MaintenanceRpaService = require('../../services/maintenance/maintenanceRpaService');

exports.exportWorkOrder = async (req, res, next) => {
  try {
    const result = await MaintenanceRpaService.exportWorkOrderToCmms(
      req.params.id,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: result,
      message: 'Work order exported to external CMMS'
    });
  } catch (err) {
    next(err);
  }
};

exports.syncWorkOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await MaintenanceRpaService.syncWorkOrderStatus(
      req.params.id,
      status,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: result,
      message: 'External CMMS status reconciled'
    });
  } catch (err) {
    next(err);
  }
};

exports.exportCmms = async (req, res, next) => {
  try {
    const result = await MaintenanceRpaService.exportCmmsData(req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: result,
      message: 'CMMS export completed'
    });
  } catch (err) {
    next(err);
  }
};

exports.triggerPmDispatch = async (req, res, next) => {
  try {
    const result = await MaintenanceRpaService.triggerPmDispatch(req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: result,
      message: 'PM schedule dispatch triggered'
    });
  } catch (err) {
    next(err);
  }
};

