const PreventiveService = require('../../services/maintenance/preventiveService');

exports.createPlan = async (req, res, next) => {
  try {
    const plan = await PreventiveService.createPlan(req.body, req.user?._id || req.user?.id);
    res.status(201).json({
      success: true,
      data: plan,
      message: 'Preventive maintenance plan configured'
    });
  } catch (err) {
    next(err);
  }
};

exports.getPlans = async (req, res, next) => {
  try {
    const result = await PreventiveService.getPlans(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

exports.getPlanById = async (req, res, next) => {
  try {
    const plan = await PreventiveService.getPlanById(req.params.id);
    res.json({
      success: true,
      data: plan
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await PreventiveService.updatePlan(req.params.id, req.body, req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: plan,
      message: 'Plan details updated'
    });
  } catch (err) {
    next(err);
  }
};

exports.generateWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await PreventiveService.generateWorkOrderFromPlan(
      req.params.id,
      req.user?._id || req.user?.id
    );
    res.status(201).json({
      success: true,
      data: workOrder,
      message: 'Preventive work order generated successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.generateDueWorkOrders = async (req, res, next) => {
  try {
    const result = await PreventiveService.generateDueWorkOrders(req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: result,
      message: `Generated ${result.count} preventive work orders`
    });
  } catch (err) {
    next(err);
  }
};

