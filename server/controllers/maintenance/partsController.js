const PartsService = require('../../services/maintenance/partsService');

exports.createPartRequest = async (req, res, next) => {
  try {
    const partReq = await PartsService.createPartRequest(req.body, req.user?._id || req.user?.id);
    res.status(201).json({
      success: true,
      data: partReq,
      message: 'Spare part request submitted'
    });
  } catch (err) {
    next(err);
  }
};

exports.getPartRequests = async (req, res, next) => {
  try {
    const result = await PartsService.getPartRequests(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

exports.approvePartRequest = async (req, res, next) => {
  try {
    const partReq = await PartsService.approvePartRequest(req.params.id, req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: partReq,
      message: 'Part request approved'
    });
  } catch (err) {
    next(err);
  }
};

exports.issuePart = async (req, res, next) => {
  try {
    const partReq = await PartsService.issuePart(req.params.id, req.body, req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: partReq,
      message: 'Part issued and cost applied to work order'
    });
  } catch (err) {
    next(err);
  }
};

exports.returnPart = async (req, res, next) => {
  try {
    const partReq = await PartsService.returnPart(req.params.id, req.body, req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: partReq,
      message: 'Unused part marked as returned'
    });
  } catch (err) {
    next(err);
  }
};
