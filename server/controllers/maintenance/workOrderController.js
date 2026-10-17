const WorkOrderService = require('../../services/maintenance/workOrderService');

exports.createWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrderService.createWorkOrder(req.body, req.user?._id || req.user?.id);
    res.status(201).json({
      success: true,
      data: workOrder,
      message: 'Maintenance work order created'
    });
  } catch (err) {
    next(err);
  }
};

exports.getWorkOrders = async (req, res, next) => {
  try {
    const result = await WorkOrderService.getWorkOrders(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

exports.getWorkOrderById = async (req, res, next) => {
  try {
    const workOrder = await WorkOrderService.getWorkOrderById(req.params.id);
    res.json({
      success: true,
      data: workOrder
    });
  } catch (err) {
    next(err);
  }
};

exports.assignWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrderService.assignWorkOrder(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: workOrder,
      message: 'Work order successfully assigned'
    });
  } catch (err) {
    next(err);
  }
};

exports.scheduleWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrderService.scheduleWorkOrder(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: workOrder,
      message: 'Work order scheduled'
    });
  } catch (err) {
    next(err);
  }
};

exports.startWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrderService.startWorkOrder(req.params.id, req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: workOrder,
      message: 'Maintenance work started'
    });
  } catch (err) {
    next(err);
  }
};

exports.holdWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrderService.holdWorkOrder(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: workOrder,
      message: `Work order placed on hold (${workOrder.status})`
    });
  } catch (err) {
    next(err);
  }
};

exports.resumeWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrderService.resumeWorkOrder(
      req.params.id,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: workOrder,
      message: 'Work order resumed to in progress'
    });
  } catch (err) {
    next(err);
  }
};


exports.completeWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrderService.completeWorkOrder(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: workOrder,
      message: 'Work order submitted for verification'
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrderService.verifyWorkOrder(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: workOrder,
      message: 'Work order verification completed'
    });
  } catch (err) {
    next(err);
  }
};

exports.closeWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrderService.closeWorkOrder(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: workOrder,
      message: 'Work order closed & asset updated'
    });
  } catch (err) {
    next(err);
  }
};

exports.reopenWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrderService.reopenWorkOrder(
      req.params.id,
      req.body.reason,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: workOrder,
      message: 'Work order reopened'
    });
  } catch (err) {
    next(err);
  }
};

exports.getCalendar = async (req, res, next) => {
  try {
    const events = await WorkOrderService.getCalendar(req.query);
    res.json({
      success: true,
      data: events
    });
  } catch (err) {
    next(err);
  }
};
