const ChecklistService = require('../../services/maintenance/checklistService');

exports.createChecklist = async (req, res, next) => {
  try {
    const checklist = await ChecklistService.createChecklist(req.body, req.user?._id || req.user?.id);
    res.status(201).json({
      success: true,
      data: checklist,
      message: 'Maintenance checklist created'
    });
  } catch (err) {
    next(err);
  }
};

exports.getChecklists = async (req, res, next) => {
  try {
    const checklists = await ChecklistService.getChecklists(req.query);
    res.json({
      success: true,
      data: checklists
    });
  } catch (err) {
    next(err);
  }
};

exports.getChecklistById = async (req, res, next) => {
  try {
    const checklist = await ChecklistService.getChecklistById(req.params.id);
    res.json({
      success: true,
      data: checklist
    });
  } catch (err) {
    next(err);
  }
};

exports.updateChecklist = async (req, res, next) => {
  try {
    const checklist = await ChecklistService.updateChecklist(req.params.id, req.body, req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: checklist,
      message: 'Checklist updated'
    });
  } catch (err) {
    next(err);
  }
};
