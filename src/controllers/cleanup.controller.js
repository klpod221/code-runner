const { cleanupOldExecutions } = require("../services/cleanup.service");

/**
 * Controller for cleanup operations
 */

/**
 * Manually trigger cleanup of old code executions
 * Admin users can perform cleanup with custom parameters
 */
exports.manualCleanup = async (req, res) => {
  try {
    const {
      days = process.env.CODE_EXECUTION_RETENTION_DAYS || 7,
      dryRun = false,
      ignorePersistent = false,
    } = req.body;

    // Convert parameters to appropriate types
    const options = {
      days: parseInt(days),
      dryRun: dryRun === true || dryRun === "true",
      ignorePersistent: ignorePersistent === true || ignorePersistent === "true",
    };

    // Validate parameters
    if (isNaN(options.days) || options.days <= 0) {
      return res.status(400).json({
        message: "Invalid days parameter. Must be a positive number.",
      });
    }

    console.log(`[${req.id}] Manual cleanup triggered by user ${req.user.id} with options:`, options);

    // Perform cleanup
    const result = await cleanupOldExecutions(options);

    res.status(200).json({
      message: "Cleanup operation completed successfully",
      result: {
        cutoffDate: result.cutoffDate,
        identifiedExecutions: result.identifiedExecutions,
        identifiedTestCases: result.identifiedTestCases,
        deletedExecutions: result.deletedExecutions,
        deletedTestCases: result.deletedTestCases,
        dryRun: result.dryRun,
        executionIds: result.dryRun ? result.executionIds : undefined,
      },
    });
  } catch (error) {
    console.error(`[${req.id}] Error during manual cleanup:`, error);
    
    res.status(500).json({
      message: "Error performing cleanup operation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get cleanup configuration status
 * Returns current configuration for the cleanup process
 */
exports.getCleanupConfig = async (req, res) => {
  try {
    const config = {
      retentionDays: parseInt(process.env.CODE_EXECUTION_RETENTION_DAYS) || 7,
      cronSchedule: process.env.CLEANUP_CRON_SCHEDULE || '0 0 * * *', // Default: daily at midnight
      cleanupEnabled: process.env.ENABLE_AUTO_CLEANUP !== 'false', // Enabled by default unless explicitly disabled
      lastCleanupStats: {
        // This would ideally come from a database or cache, but for now returning placeholder
        lastRun: null,
        executionsDeleted: 0, 
        testCasesDeleted: 0
      }
    };
    
    res.status(200).json({
      message: "Cleanup configuration retrieved successfully",
      config,
    });
  } catch (error) {
    console.error(`[${req.id}] Error retrieving cleanup config:`, error);
    
    res.status(500).json({
      message: "Error retrieving cleanup configuration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};