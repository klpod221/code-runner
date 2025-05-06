// Utility functions

/**
 * Get current timestamp as string
 */
exports.getCurrentTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Generate random number between min and max (inclusive)
 */
exports.getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Print message with timestamp
 */
exports.printMessage = (message) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
};