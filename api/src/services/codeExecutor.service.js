const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Initialize supported languages from environment or default setting
// This will be updated when getSupportedLanguages is called
let supportedLanguages = ["nodejs", "python", "java", "cpp", "c"];

/**
 * Execute code by sending a request to the executor service
 * 
 * @param {Object} options - Execution options
 * @param {string} options.language - Programming language
 * @param {Array<Object>} options.files - Array of file objects
 * @param {string} options.stdin - Standard input
 * @param {string} options.executionId - Unique execution ID
 * @returns {Promise<Object>} Execution result
 */
async function executeCode({ language, files, stdin = "", executionId = "" }) {
  try {
    // Generate execution ID if not provided
    const execution = executionId || uuidv4();
    
    // Get executor URL from environment variable
    const executorUrl = process.env.CODE_RUNNER_URL || 'http://executor:8080';

    // Send request to executor service
    const response = await axios.post(`${executorUrl}/execute/code`, {
      language,
      files,
      stdin,
      executionId: execution
    });

    return response.data;
  } catch (error) {
    // Handle axios errors
    if (error.response) {
      // Server returned an error
      const errorData = error.response.data;
      const statusCode = error.response.status;
      
      // Create custom error object
      const customError = new Error(errorData.error || "Code execution failed");
      customError.status = statusCode;
      customError.details = errorData;
      throw customError;
    } else if (error.request) {
      // Request was made but no response was received
      const connectionError = new Error("No response from executor service");
      connectionError.status = 503;
      throw connectionError;
    } else {
      // Error in setting up the request
      const setupError = new Error(`Request error: ${error.message}`);
      setupError.status = 500;
      throw setupError;
    }
  }
}

/**
 * Get supported programming languages from executor service
 * 
 * @returns {Promise<Array<string>>} List of supported language names
 */
async function getSupportedLanguages() {
  try {
    // Get executor URL from environment variable
    const executorUrl = process.env.CODE_RUNNER_URL || 'http://executor:8080';
    
    // Query the executor service for supported languages
    const response = await axios.get(`${executorUrl}/execute/languages`);
    
    if (response.data && response.status === 200 && response.data.languages) {
      // Update cached supported languages list
      supportedLanguages = response.data.languages;
    } else {
      console.warn("Could not fetch supported languages from executor service");
    }
  } catch (error) {
    console.error(`Error getting supported languages: ${error.message}`);
    // Fallback to cached languages list
  }
  
  return supportedLanguages;
}

module.exports = {
  executeCode,
  getSupportedLanguages,
  supportedLanguages
};
