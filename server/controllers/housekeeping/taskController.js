const TaskService = require('../../services/housekeeping/taskService');
const BedIntegrationService = require('../../services/housekeeping/bedIntegrationService');

const createTask = async (req, res) => {
  try {
    const { task, isExisting } = await TaskService.createTask(req.body, req.user);
    res.status(isExisting ? 200 : 201).json({ success: true, data: task, isExisting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listTasks = async (req, res) => {
  try {
    const tasks = await TaskService.listTasks(req.query);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await TaskService.getTaskById(req.params.id);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await TaskService.updateTask(req.params.id, req.body, req.user);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const assignTask = async (req, res) => {
  try {
    const task = await TaskService.assignTask(req.params.id, req.body, req.user);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const scheduleTask = async (req, res) => {
  try {
    const task = await TaskService.scheduleTask(req.params.id, req.body, req.user);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const startTask = async (req, res) => {
  try {
    const task = await TaskService.startTask(req.params.id, req.user);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const holdTask = async (req, res) => {
  try {
    const task = await TaskService.holdTask(req.params.id, req.body, req.user);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const completeTask = async (req, res) => {
  try {
    const task = await TaskService.completeTask(req.params.id, req.body, req.user);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const closeTask = async (req, res) => {
  try {
    const task = await TaskService.closeTask(req.params.id, req.user);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const reopenTask = async (req, res) => {
  try {
    const task = await TaskService.reopenTask(req.params.id, req.body, req.user);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const triggerBedTurnover = async (req, res) => {
  try {
    const result = await BedIntegrationService.triggerBedTurnover(req.body, req.user);
    res.status(result.isDuplicate ? 200 : 201).json({ success: true, data: result.task, isDuplicate: result.isDuplicate });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getTurnoverBoard = async (req, res) => {
  try {
    const board = await BedIntegrationService.getTurnoverBoard();
    res.json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  assignTask,
  scheduleTask,
  startTask,
  holdTask,
  completeTask,
  closeTask,
  reopenTask,
  triggerBedTurnover,
  getTurnoverBoard
};
