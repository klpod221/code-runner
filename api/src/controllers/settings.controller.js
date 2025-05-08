const { settings: Settings } = require("../models");
const SettingsService = require("../services/settings.service");
const { validateCronExpression } = require("../services/cleanup.service");

/**
 * Controller for managing application settings
 * Only accessible by administrators
 */

// Get all settings
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await SettingsService.getAllSettings();

    // Map to a more user-friendly format
    const formattedSettings = settings.map(setting => ({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy,
    }));

    res.status(200).json({
      message: "Settings retrieved successfully",
      settings: formattedSettings
    });
  } catch (error) {
    console.error(`[${req.id}] Error retrieving settings:`, error);
    
    res.status(500).json({
      message: "Error retrieving settings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update a setting
exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    
    // Validate input
    if (!key || value === undefined) {
      return res.status(400).json({
        message: "Key and value are required"
      });
    }
    
    // Additional validation for specific settings
    if (key === "CLEANUP_CRON_SCHEDULE") {
      if (!validateCronExpression(value)) {
        return res.status(400).json({
          message: "Invalid cron expression format"
        });
      }
    } else if (key === "RATE_LIMIT_WINDOW" || key === "RATE_LIMIT_MAX" || key === "CODE_EXECUTION_RETENTION_DAYS") {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue <= 0) {
        return res.status(400).json({
          message: "Value must be a positive number"
        });
      }
    } else if (key === "ALLOW_REGISTRATION" || key === "ENABLE_AUTO_CLEANUP") {
      if (value !== "true" && value !== "false") {
        return res.status(400).json({
          message: "Value must be 'true' or 'false'"
        });
      }
    }
    
    // Check if setting exists
    const existingSetting = await Settings.findOne({ where: { key } });
    
    if (!existingSetting) {
      return res.status(404).json({
        message: "Setting not found"
      });
    }

    // Update setting
    await SettingsService.updateSetting(key, value, req.user.id);
    
    res.status(200).json({
      message: "Setting updated successfully",
      setting: {
        key,
        value,
        description: existingSetting.description,
        updatedAt: new Date(),
      }
    });
  } catch (error) {
    console.error(`[${req.id}] Error updating setting:`, error);
    
    res.status(500).json({
      message: "Error updating setting",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get settings by category (for organization)
exports.getSettingsByCategory = async (req, res) => {
  try {
    const settings = await SettingsService.getAllSettings();
    
    // Organize settings by category
    const categories = {
      registration: ["ALLOW_REGISTRATION"],
      rateLimit: ["RATE_LIMIT_WINDOW", "RATE_LIMIT_MAX"],
      cleanup: ["ENABLE_AUTO_CLEANUP", "CODE_EXECUTION_RETENTION_DAYS", "CLEANUP_CRON_SCHEDULE"],
      other: []
    };
    
    const result = {
      registration: {},
      rateLimit: {},
      cleanup: {},
      other: {}
    };
    
    // Sort settings into categories
    settings.forEach(setting => {
      let category = "other";
      
      Object.keys(categories).forEach(cat => {
        if (categories[cat].includes(setting.key)) {
          category = cat;
        }
      });
      
      result[category][setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt,
      };
    });
    
    res.status(200).json({
      message: "Settings retrieved successfully",
      settings: result
    });
  } catch (error) {
    console.error(`[${req.id}] Error retrieving settings by category:`, error);
    
    res.status(500).json({
      message: "Error retrieving settings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};