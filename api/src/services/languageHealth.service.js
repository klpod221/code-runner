const axios = require("axios");
const { supportedLanguages } = require("./codeExecutor.service");
const settingsService = require("./settings.service");

/**
 * Service for checking programming language health in the executor service
 */

/**
 * Check if a language is available by querying the executor service
 * 
 * @param {string} language - Language name to check
 * @returns {Promise<Object>} - Language health status
 */
async function checkLanguageHealth(language) {
  // Default result structure
  const healthStatus = {
    name: language,
    status: "unknown",
    version: null,
    expectedVersion: null,
    details: null
  };

  try {
    // Get expected version from settings if available
    switch (language) {
      case 'nodejs':
        healthStatus.expectedVersion = await settingsService.getSetting('NODEJS_VERSION', '');
        break;
      case 'python':
        healthStatus.expectedVersion = await settingsService.getSetting('PYTHON_VERSION', '');
        break;
      case 'java':
        healthStatus.expectedVersion = await settingsService.getSetting('JAVA_VERSION', '');
        break;
      case 'cpp':
        healthStatus.expectedVersion = await settingsService.getSetting('CPP_VERSION', '');
        break;
      case 'c':
        healthStatus.expectedVersion = await settingsService.getSetting('C_VERSION', '');
        break;
    }

    // Get executor URL from environment variable
    const executorUrl = process.env.CODE_RUNNER_URL || 'http://executor:8080';
    
    // Query the executor service for language health
    const response = await axios.get(`${executorUrl}/execute/health/language/${language}`);
    
    if (response.data && response.status === 200) {
      // Update health status with data from executor
      healthStatus.status = response.data.status;
      healthStatus.version = response.data.version;
      healthStatus.details = response.data.details;
    } else {
      healthStatus.status = "unavailable";
      healthStatus.details = "Failed to get language status from executor service";
    }
  } catch (error) {
    healthStatus.status = "error";
    healthStatus.details = `Error connecting to executor service: ${error.message}`;
  }

  return healthStatus;
}

/**
 * Check health status for all supported languages
 * 
 * @returns {Promise<Array>} - Health status for all languages
 */
async function checkAllLanguagesHealth() {
  const results = [];

  for (const language of supportedLanguages) {
    const status = await checkLanguageHealth(language);
    results.push(status);
  }

  return results;
}

/**
 * Verify if all required languages are available
 * 
 * @returns {Promise<Object>} - System health status for languages
 */
async function getLanguageSystemHealth() {
  try {
    // Get executor URL from environment variable
    const executorUrl = process.env.CODE_RUNNER_URL || 'http://executor:8080';
    
    // Query the executor service for all languages health at once
    const response = await axios.get(`${executorUrl}/execute/health/languages`);
    
    if (response.data && response.status === 200) {
      return response.data;
    } else {
      // Fallback to individual checks if bulk endpoint fails
      const healthResults = await checkAllLanguagesHealth();
      
      // Count unavailable languages
      const unavailableCount = healthResults.filter(lang => lang.status !== "available").length;
      
      return {
        status: unavailableCount === 0 ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        detail: unavailableCount === 0 
          ? "All languages are available" 
          : `${unavailableCount} language(s) unavailable`,
        languages: healthResults
      };
    }
  } catch (error) {
    // Fallback to individual checks if executor service is unavailable
    const healthResults = await checkAllLanguagesHealth();
    
    return {
      status: "degraded",
      timestamp: new Date().toISOString(),
      detail: `Error connecting to executor service: ${error.message}`,
      languages: healthResults
    };
  }
}

module.exports = {
  checkLanguageHealth,
  checkAllLanguagesHealth,
  getLanguageSystemHealth
};