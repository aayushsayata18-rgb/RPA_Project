const RequestService = require('../../services/maintenance/requestService');

exports.createRequest = async (req, res, next) => {
  try {
    const request = await RequestService.createRequest(req.body, req.user?._id || req.user?.id);
    res.status(201).json({
      success: true,
      data: request,
      message: 'Maintenance request submitted successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.getRequests = async (req, res, next) => {
  try {
    const result = await RequestService.getRequests(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

exports.getRequestById = async (req, res, next) => {
  try {
    const request = await RequestService.getRequestById(req.params.id);
    res.json({
      success: true,
      data: request
    });
  } catch (err) {
    next(err);
  }
};

exports.approveRequest = async (req, res, next) => {
  try {
    const request = await RequestService.approveRequest(req.params.id, req.user?._id || req.user?.id, req.body.notes);
    res.json({
      success: true,
      data: request,
      message: 'Maintenance request approved'
    });
  } catch (err) {
    next(err);
  }
};

exports.rejectRequest = async (req, res, next) => {
  try {
    const request = await RequestService.rejectRequest(req.params.id, req.body.reason, req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: request,
      message: 'Maintenance request rejected'
    });
  } catch (err) {
    next(err);
  }
};

exports.triageRequest = async (req, res, next) => {
  try {
    const request = await RequestService.triageRequest(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: request,
      message: 'Maintenance request triaged successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.createWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await RequestService.createWorkOrderFromRequest(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    res.status(201).json({
      success: true,
      data: workOrder,
      message: 'Work order created from maintenance request'
    });
  } catch (err) {
    next(err);
  }
};

exports.convertRequest = exports.createWorkOrder;

