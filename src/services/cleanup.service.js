const { Op } = require("sequelize");
const { CodeExecution, testCase } = require("../models");
const cron = require("node-cron");
const settingsService = require("./settings.service");

/**
 * Cleanup service for managing old code executions
 * Automatically removes non-persistent executions after a certain period
 */

// Default retention periods (can be overridden by settings)
const DEFAULT_RETENTION_DAYS = 7; // 7 days by default

/**
 * Delete old code executions and their associated test cases
 * 
 * @param {Object} options - Cleanup options
 * @param {number} options.days - Number of days to keep executions (default: 7)
 * @param {boolean} options.dryRun - If true, only count but don't delete (default: false)
 * @param {boolean} options.ignorePersistent - If false, respect isPersistent flag (default: false)
 * @returns {Promise<Object>} - Statistics about deleted records
 */
async function cleanupOldExecutions({
  days = null,
  dryRun = false,
  ignorePersistent = false
} = {}) {
  try {
    // If days not provided, get from settings
    if (days === null) {
      days = await settingsService.getNumericSetting("CODE_EXECUTION_RETENTION_DAYS", DEFAULT_RETENTION_DAYS);
    }
    
    console.log(`Starting cleanup of executions older than ${days} days (dry run: ${dryRun})`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Build where clause
    const whereClause = {
      createdAt: {
        [Op.lt]: cutoffDate
      }
    };
    
    // Unless we're ignoring persistent flag, exclude persistent executions
    if (!ignorePersistent) {
      whereClause.isPersistent = false;
    }
    
    // Count records that would be deleted
    const executionCount = await CodeExecution.count({ where: whereClause });
    
    // Find IDs of executions to delete (needed to delete related test cases)
    const executionsToDelete = await CodeExecution.findAll({
      where: whereClause,
      attributes: ['id']
    });
    
    const executionIds = executionsToDelete.map(exec => exec.id);
    
    // Count test cases that would be deleted
    let testCaseCount = 0;
    if (executionIds.length > 0) {
      testCaseCount = await testCase.count({
        where: {
          codeExecutionId: {
            [Op.in]: executionIds
          }
        }
      });
    }
    
    // If not a dry run, perform the actual deletion
    let deletedExecutions = 0;
    let deletedTestCases = 0;
    
    if (!dryRun && executionIds.length > 0) {
      // Delete test cases first (foreign key constraint)
      if (testCaseCount > 0) {
        deletedTestCases = await testCase.destroy({
          where: {
            codeExecutionId: {
              [Op.in]: executionIds
            }
          }
        });
      }
      
      // Then delete executions
      deletedExecutions = await CodeExecution.destroy({ where: whereClause });
    }
    
    // Return statistics
    return {
      cutoffDate,
      identifiedExecutions: executionCount,
      identifiedTestCases: testCaseCount,
      deletedExecutions: dryRun ? 0 : deletedExecutions,
      deletedTestCases: dryRun ? 0 : deletedTestCases,
      dryRun,
      executionIds: dryRun ? executionIds : []
    };
  } catch (error) {
    console.error('Error during cleanup process:', error);
    throw error;
  }
}

/**
 * Validate a cron expression
 * 
 * @param {string} cronExpression - The cron expression to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateCronExpression(cronExpression) {
  return cron.validate(cronExpression);
}

/**
 * Schedule automatic cleanup of old executions
 * Uses settings from the database
 * 
 * @param {string} cronExpression - Cron expression for scheduling (default: from settings or daily at midnight)
 */
async function scheduleCleanup(cronExpression = null) {
  // If no cron expression provided, get from settings
  if (!cronExpression) {
    cronExpression = await settingsService.getSetting("CLEANUP_CRON_SCHEDULE", '0 0 * * *');
  }
  
  // Validate cron expression
  if (!validateCronExpression(cronExpression)) {
    console.error(`Invalid cron expression: ${cronExpression}`);
    console.error('Using default schedule: daily at midnight (0 0 * * *)');
    cronExpression = '0 0 * * *';
  }
  
  // Check if cleanup is enabled
  const cleanupEnabled = await settingsService.getBooleanSetting("ENABLE_AUTO_CLEANUP", true);
  
  if (!cleanupEnabled) {
    console.log('Automated execution cleanup is disabled in settings');
    return;
  }
  
  cron.schedule(cronExpression, async () => {
    try {
      // Check again if cleanup is enabled (settings may have changed)
      const stillEnabled = await settingsService.getBooleanSetting("ENABLE_AUTO_CLEANUP", true);
      if (!stillEnabled) {
        console.log('Scheduled cleanup skipped: automation disabled in settings');
        return;
      }
      
      console.log('Running scheduled cleanup of old code executions...');
      const result = await cleanupOldExecutions();
      console.log(`Cleanup completed: ${result.deletedExecutions} executions and ${result.deletedTestCases} test cases deleted`);
    } catch (error) {
      console.error('Scheduled cleanup failed:', error);
    }
  });
}

module.exports = {
  cleanupOldExecutions,
  scheduleCleanup,
  validateCronExpression
};