const { spawnSync } = require("child_process");
const { supportedLanguages } = require("./codeExecutor.service");
const settingsService = require("./settings.service");

/**
 * Service for checking programming language health in the container
 */

/**
 * Check if a language is available by running a test command
 * 
 * @param {string} language - Language name to check
 * @returns {Promise<Object>} - Language health status
 */
async function checkLanguageHealth(language) {
  // Define commands to check language versions
  const versionCommands = {
    nodejs: { cmd: "node", args: ["--version"] },
    python: { cmd: "python3", args: ["--version"] },
    java: { cmd: "java", args: ["-version"] },
    cpp: { cmd: "g++", args: ["--version"] },
    c: { cmd: "gcc", args: ["--version"] }
  };

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

    if (versionCommands[language]) {
      // Use spawnSync instead of execSync to properly capture both stdout and stderr
      const command = versionCommands[language];
      const result = spawnSync(command.cmd, command.args, {
        encoding: 'utf8',
        timeout: 5000,
        shell: false
      });

      if (result.status === 0) {
        // Command executed successfully
        let versionOutput;
        
        // Java specifically outputs to stderr
        if (language === 'java') {
          versionOutput = result.stderr;
        } else {
          versionOutput = result.stdout || result.stderr;
        }

        healthStatus.status = "available";
        healthStatus.version = versionOutput.trim();
        healthStatus.details = "Language is properly installed";
      } else {
        // Command failed
        healthStatus.status = "unavailable";
        healthStatus.details = result.error ? result.error.message : "Failed to execute language command";
      }
    }
  } catch (error) {
    healthStatus.status = "error";
    healthStatus.details = error.message;
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

module.exports = {
  checkLanguageHealth,
  checkAllLanguagesHealth,
  getLanguageSystemHealth
};