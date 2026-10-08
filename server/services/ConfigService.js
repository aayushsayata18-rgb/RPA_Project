const HospitalConfiguration = require('../models/HospitalConfiguration');

// In-memory cache for high-frequency settings
const configCache = new Map();

class ConfigService {
  /**
   * Get dynamic configuration value with default fallback
   */
  static async get(key, defaultValue = null) {
    if (configCache.has(key)) {
      return configCache.get(key);
    }

    try {
      const config = await HospitalConfiguration.findOne({ configKey: key });
      if (config) {
        configCache.set(key, config.value);
        return config.value;
      }
    } catch (error) {
      console.warn(`[ConfigService Warning]: Failed to fetch config '${key}':`, error.message);
    }

    return defaultValue;
  }

  /**
   * Set dynamic configuration value
   */
  static async set(key, value, category = 'GENERAL', displayName = null, description = null) {
    const config = await HospitalConfiguration.findOneAndUpdate(
      { configKey: key },
      {
        configKey: key,
        value,
        category,
        displayName: displayName || key,
        description: description || ''
      },
      { upsert: true, new: true }
    );

    configCache.set(key, value);
    return config;
  }

  static clearCache() {
    configCache.clear();
  }
}

module.exports = ConfigService;
