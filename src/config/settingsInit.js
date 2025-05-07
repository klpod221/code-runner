const { settings: Settings } = require("../models");

/**
 * Initialize default settings in the database
 */
const initSettings = async () => {
  try {
    // Check if settings already exist
    const count = await Settings.count();
    
    if (count > 0) {
      return;
    }
    
    // Define default settings
    const defaultSettings = [
      {
        key: "ALLOW_REGISTRATION",
        value: "false",
        description: "Allow users to self-register"
      },
      {
        key: "RATE_LIMIT_WINDOW",
        value: "15",
        description: "Rate limit window in minutes"
      },
      {
        key: "RATE_LIMIT_MAX",
        value: "100",
        description: "Maximum requests per rate limit window"
      },
      {
        key: "ENABLE_AUTO_CLEANUP",
        value: "true",
        description: "Enable automatic cleanup of old executions"
      },
      {
        key: "CODE_EXECUTION_RETENTION_DAYS",
        value: "7",
        description: "Number of days to keep code executions before cleanup"
      },
      {
        key: "CLEANUP_CRON_SCHEDULE",
        value: "0 0 * * *",
        description: "Cron schedule for automatic cleanup"
      },
      {
        key: "MAX_EXECUTION_TIME",
        value: "10000",
        description: "Maximum execution time in milliseconds"
      },
      {
        key: "MAX_MEMORY",
        value: "512",
        description: "Maximum memory usage in MB"
      }
    ];
    
    // Create settings in database
    await Settings.bulkCreate(defaultSettings);
    console.log("Default settings initialized successfully");
  } catch (error) {
    console.error("Error initializing settings:", error);
  }
};

module.exports = { initSettings };