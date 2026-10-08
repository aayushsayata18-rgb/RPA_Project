const RPAJob = require('../models/RPAJob');
const RPAJobService = require('../services/RPAJobService');

// @desc    Get RPA jobs dashboard list
// @route   GET /api/rpa/jobs
// @access  Private (Admin / Management)
exports.getJobs = async (req, res, next) => {
  try {
    const { module, status, targetSystem, page = 1, limit = 20 } = req.query;
    const query = {};

    if (module) query.module = module;
    if (status) query.status = status;
    if (targetSystem) query.targetSystem = targetSystem;

    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      RPAJob.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      RPAJob.countDocuments(query)
    ]);

    // Summary statistics for dashboard cards
    const stats = await RPAJob.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusCounts = {
      TOTAL: total,
      RUNNING: 0,
      SUCCESS: 0,
      FAILED: 0,
      RETRYING: 0,
      EXCEPTION: 0
    };

    stats.forEach((s) => {
      if (statusCounts[s._id] !== undefined) statusCounts[s._id] = s.count;
    });

    res.json({
      success: true,
      data: {
        jobs,
        total,
        statusCounts,
        page: Number(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create manual RPA trigger
// @route   POST /api/rpa/jobs
// @access  Private (Admin)
exports.createJob = async (req, res, next) => {
  try {
    const { jobName, module, targetSystem, action, entityType, entityId, payload } = req.body;

    const job = await RPAJobService.createJob({
      jobName,
      module,
      targetSystem,
      action,
      entityType,
      entityId,
      payload,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'RPA job queued successfully.',
      data: job
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Callback from Robot Framework worker to update job status
// @route   POST /api/rpa/jobs/:jobId/status
// @access  Protected via RPA_SHARED_SECRET or Token
exports.updateJobStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status, result, error, evidencePaths, logs } = req.body;

    const job = await RPAJobService.updateJobStatus({
      jobId,
      status,
      result,
      error,
      evidencePaths,
      logs
    });

    res.json({
      success: true,
      message: 'RPA job status updated.',
      data: job
    });
  } catch (error) {
    next(error);
  }
};
