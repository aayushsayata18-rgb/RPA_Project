const AssetService = require('../../services/maintenance/assetService');
const AssetCategory = require('../../models/AssetCategory');

exports.createAsset = async (req, res, next) => {
  try {
    const asset = await AssetService.createAsset(req.body, req.user?._id || req.user?.id);
    res.status(201).json({
      success: true,
      data: asset,
      message: 'Asset successfully registered'
    });
  } catch (err) {
    next(err);
  }
};

exports.getAssets = async (req, res, next) => {
  try {
    const result = await AssetService.getAssets(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

exports.getAssetById = async (req, res, next) => {
  try {
    const asset = await AssetService.getAssetById(req.params.id);
    res.json({
      success: true,
      data: asset
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAsset = async (req, res, next) => {
  try {
    const asset = await AssetService.updateAsset(req.params.id, req.body, req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: asset,
      message: 'Asset details updated'
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAssetStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const asset = await AssetService.updateAssetStatus(
      req.params.id,
      status,
      reason,
      req.user?._id || req.user?.id
    );
    res.json({
      success: true,
      data: asset,
      message: `Asset status updated to ${status}`
    });
  } catch (err) {
    next(err);
  }
};

exports.getAssetHistory = async (req, res, next) => {
  try {
    const history = await AssetService.getAssetHistory(req.params.id);
    res.json({
      success: true,
      data: history
    });
  } catch (err) {
    next(err);
  }
};

exports.checkDuplicates = async (req, res, next) => {
  try {
    const duplicates = await AssetService.detectDuplicates(req.body);
    res.json({
      success: true,
      hasDuplicates: duplicates.length > 0,
      data: duplicates
    });
  } catch (err) {
    next(err);
  }
};

// Categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await AssetCategory.find({ active: true }).sort({ name: 1 }).lean();
    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (!data.categoryId) {
      data.categoryId = data.categoryCode || `CAT-${Date.now().toString().slice(-6)}`;
    }
    const category = new AssetCategory(data);
    await category.save();
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (err) {
    next(err);
  }
};
