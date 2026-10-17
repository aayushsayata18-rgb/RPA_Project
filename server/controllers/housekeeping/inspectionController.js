const InspectionService = require('../../services/housekeeping/inspectionService');

const performInspection = async (req, res) => {
  try {
    const inspection = await InspectionService.performInspection(req.body, req.user);
    res.status(201).json({ success: true, data: inspection, taskStatus: inspection.taskStatus, inspectionStatus: inspection.status });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listInspections = async (req, res) => {
  try {
    const inspections = await InspectionService.listInspections(req.query);
    res.json({ success: true, data: inspections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInspectionById = async (req, res) => {
  try {
    const inspection = await InspectionService.getInspectionById(req.params.id);
    res.json({ success: true, data: inspection });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = {
  performInspection,
  listInspections,
  getInspectionById
};
