const HospitalConfiguration = require('../models/HospitalConfiguration');
const ConfigService = require('../services/ConfigService');
const AuditService = require('../services/AuditService');

// @desc    Get all hospital configuration settings
// @route   GET /api/configuration
// @access  Private (Admin / Management)
exports.getConfigurations = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category) query.category = category;

    const configurations = await HospitalConfiguration.find(query).sort({ category: 1, configKey: 1 });
    res.json({
      success: true,
      data: configurations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a hospital configuration
// @route   PUT /api/configuration/:configKey
// @access  Private (Admin)
exports.updateConfiguration = async (req, res, next) => {
  try {
    const { configKey } = req.params;
    const { value, description } = req.body;

    const config = await HospitalConfiguration.findOne({ configKey });
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Configuration key '${configKey}' not found.`,
        errorCode: 'CONFIG_NOT_FOUND'
      });
    }

    if (!config.isEditable) {
      return res.status(400).json({
        success: false,
        message: `Configuration key '${configKey}' is locked by system and cannot be edited.`,
        errorCode: 'CONFIG_LOCKED'
      });
    }

    const oldValue = config.value;
    config.value = value;
    if (description) config.description = description;
    await config.save();

    ConfigService.clearCache();

    await AuditService.logEvent({
      userId: req.user.userId,
      role: req.user.role,
      action: 'CONFIGURATION_UPDATED',
      module: 'CONFIG',
      entityType: 'HospitalConfiguration',
      entityId: configKey,
      oldValue: { value: oldValue },
      newValue: { value },
      details: `Updated configuration for ${configKey}`
    });

    res.json({
      success: true,
      message: `Configuration '${configKey}' updated successfully.`,
      data: config
    });
  } catch (error) {
    next(error);
  }
};
