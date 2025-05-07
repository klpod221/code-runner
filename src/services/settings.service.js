const { settings: Settings } = require("../models");

/**
 * Cache for settings to avoid frequent database access
 * Will be invalidated when settings are updated
 */
let settingsCache = {};
let cacheLastUpdated = null;
const CACHE_TTL = 60 * 1000; // 1 minute in milliseconds

/**
 * Get a setting by key
 * 
 * @param {string} key - The setting key
 * @param {*} defaultValue - Default value if setting not found
 * @returns {Promise<string>} - The setting value
 */
const getSetting = async (key, defaultValue = null) => {
  // Check if we need to refresh cache
  const now = Date.now();
  if (!cacheLastUpdated || now - cacheLastUpdated > CACHE_TTL) {
    await refreshCache();
  }

  // Return from cache if available
  if (settingsCache[key] !== undefined) {
    return settingsCache[key];
  }

  // Fallback to DB if not in cache
  try {
    const setting = await Settings.findOne({ where: { key } });
    if (setting) {
      settingsCache[key] = setting.value;
      return setting.value;
    }
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
  }
  
  // Return default value if setting not found
  return defaultValue;
};

/**
 * Get a boolean setting value
 * 
 * @param {string} key - The setting key
 * @param {boolean} defaultValue - Default value if setting not found
 * @returns {Promise<boolean>} - The setting value as boolean
 */
const getBooleanSetting = async (key, defaultValue = false) => {
  const value = await getSetting(key, defaultValue.toString());
  return value === "true";
};

/**
 * Get a numeric setting value
 * 
 * @param {string} key - The setting key
 * @param {number} defaultValue - Default value if setting not found
 * @returns {Promise<number>} - The setting value as number
 */
const getNumericSetting = async (key, defaultValue = 0) => {
  const value = await getSetting(key, defaultValue.toString());
  const number = Number(value);
  return isNaN(number) ? defaultValue : number;
};

/**
 * Update a setting value
 * 
 * @param {string} key - The setting key
 * @param {string} value - The new setting value
 * @param {string} userId - ID of user who updated the setting
 * @returns {Promise<Object>} - The updated setting
 */
const updateSetting = async (key, value, userId = null) => {
  try {
    const [setting, created] = await Settings.findOrCreate({
      where: { key },
      defaults: { value, updatedBy: userId }
    });
    
    if (!created) {
      await setting.update({ 
        value,
        updatedBy: userId
      });
    }
    
    // Clear cache to ensure latest values are used
    invalidateCache();
    
    return setting;
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
};

/**
 * Get all settings
 * 
 * @returns {Promise<Array>} - Array of all settings
 */
const getAllSettings = async () => {
  try {
    return await Settings.findAll({
      order: [['key', 'ASC']]
    });
  } catch (error) {
    console.error("Error getting all settings:", error);
    throw error;
  }
};

/**
 * Refresh the settings cache
 */
const refreshCache = async () => {
  try {
    const allSettings = await Settings.findAll();
    const newCache = {};
    
    allSettings.forEach(setting => {
      newCache[setting.key] = setting.value;
    });
    
    settingsCache = newCache;
    cacheLastUpdated = Date.now();
  } catch (error) {
    console.error("Error refreshing settings cache:", error);
  }
};

/**
 * Invalidate the settings cache
 */
const invalidateCache = () => {
  cacheLastUpdated = null;
  settingsCache = {};
};

module.exports = {
  getSetting,
  getBooleanSetting,
  getNumericSetting,
  updateSetting,
  getAllSettings,
  refreshCache,
  invalidateCache
};