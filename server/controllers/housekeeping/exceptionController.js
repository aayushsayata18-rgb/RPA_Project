const ExceptionService = require('../../services/housekeeping/exceptionService');

const createException = async (req, res) => {
  try {
    const exception = await ExceptionService.createException(req.body, req.user);
    res.status(201).json({ success: true, data: exception });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listExceptions = async (req, res) => {
  try {
    const exceptions = await ExceptionService.listExceptions(req.query);
    res.json({ success: true, data: exceptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExceptionById = async (req, res) => {
  try {
    const exception = await ExceptionService.getExceptionById(req.params.id);
    res.json({ success: true, data: exception });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateException = async (req, res) => {
  try {
    const exception = await ExceptionService.updateException(req.params.id, req.body, req.user);
    res.json({ success: true, data: exception });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const resolveException = async (req, res) => {
  try {
    const exception = await ExceptionService.resolveException(req.params.id, req.body, req.user);
    res.json({ success: true, data: exception });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createException,
  listExceptions,
  getExceptionById,
  updateException,
  resolveException
};
