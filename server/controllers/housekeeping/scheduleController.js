const ScheduleService = require('../../services/housekeeping/scheduleService');

const createSchedule = async (req, res) => {
  try {
    const schedule = await ScheduleService.createSchedule(req.body, req.user);
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listSchedules = async (req, res) => {
  try {
    const schedules = await ScheduleService.listSchedules(req.query);
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getScheduleById = async (req, res) => {
  try {
    const schedule = await ScheduleService.getScheduleById(req.params.id);
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const schedule = await ScheduleService.updateSchedule(req.params.id, req.body, req.user);
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateScheduleStatus = async (req, res) => {
  try {
    const schedule = await ScheduleService.updateScheduleStatus(req.params.id, req.body.active, req.user);
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSchedule,
  listSchedules,
  getScheduleById,
  updateSchedule,
  updateScheduleStatus
};
