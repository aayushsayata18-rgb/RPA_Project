const AreaService = require('../../services/housekeeping/areaService');

const createArea = async (req, res) => {
  try {
    const area = await AreaService.createArea(req.body, req.user);
    res.status(201).json({ success: true, data: area });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listAreas = async (req, res) => {
  try {
    const areas = await AreaService.listAreas(req.query);
    res.json({ success: true, data: areas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAreaById = async (req, res) => {
  try {
    const area = await AreaService.getAreaById(req.params.id);
    res.json({ success: true, data: area });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateArea = async (req, res) => {
  try {
    const area = await AreaService.updateArea(req.params.id, req.body, req.user);
    res.json({ success: true, data: area });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateAreaStatus = async (req, res) => {
  try {
    const area = await AreaService.updateAreaStatus(req.params.id, req.body.status, req.user);
    res.json({ success: true, data: area });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createArea,
  listAreas,
  getAreaById,
  updateArea,
  updateAreaStatus
};
