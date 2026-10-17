const ChecklistService = require('../../services/housekeeping/checklistService');

const createChecklist = async (req, res) => {
  try {
    const checklist = await ChecklistService.createChecklist(req.body, req.user);
    res.status(201).json({ success: true, data: checklist });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listChecklists = async (req, res) => {
  try {
    const checklists = await ChecklistService.listChecklists(req.query);
    res.json({ success: true, data: checklists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChecklistById = async (req, res) => {
  try {
    const checklist = await ChecklistService.getChecklistById(req.params.id);
    res.json({ success: true, data: checklist });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateChecklist = async (req, res) => {
  try {
    const checklist = await ChecklistService.updateChecklist(req.params.id, req.body, req.user);
    res.json({ success: true, data: checklist });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createChecklist,
  listChecklists,
  getChecklistById,
  updateChecklist
};
