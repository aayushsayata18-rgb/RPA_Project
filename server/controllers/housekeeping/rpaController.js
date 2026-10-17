const HousekeepingRpaService = require('../../services/housekeeping/housekeepingRpaService');

const syncTurnovers = async (req, res) => {
  try {
    const result = await HousekeepingRpaService.syncTurnovers(req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const triggerRpaJob = async (req, res) => {
  try {
    const job = await HousekeepingRpaService.triggerRpaJob(req.body, req.user);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const syncExternalTaskStatus = async (req, res) => {
  try {
    const taskId = req.params.id || req.body.taskId;
    const result = await HousekeepingRpaService.syncExternalTaskStatus(taskId, req.body.externalStatus, req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  syncTurnovers,
  triggerRpaJob,
  syncExternalTaskStatus
};
