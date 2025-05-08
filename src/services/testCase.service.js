const { executeCode } = require("./codeExecutor.service");

/**
 * Execute code against multiple test cases
 * 
 * @param {Object} options - Options for test case execution
 * @param {string} options.language - Programming language name
 * @param {Array<Object>} options.files - Array of file objects { name, content, isMain }
 * @param {Array<Object>} options.testCases - Array of test case objects { input, expectedOutput, order }
 * @param {string} options.executionId - Execution ID for logging (optional)
 * @returns {Promise<Array<Object>>} Array of test case results
 */
async function executeTestCases({ language, files, testCases, executionId = "" }) {
  const results = [];

  console.log(`[${executionId}] Executing ${testCases.length} test cases for ${language}`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`[${executionId}] Executing test case #${i + 1} (order: ${testCase.order})`);

    try {
      // Execute code with test case input
      const executionResult = await executeCode({
        language,
        files,
        stdin: testCase.input || "",
        executionId,
      });

      // Compare output with expected output
      const normalizedActualOutput = (executionResult.stdout || "").trim();
      const normalizedExpectedOutput = (testCase.expectedOutput || "").trim();
      const passed = normalizedActualOutput === normalizedExpectedOutput;

      results.push({
        ...testCase,
        actualOutput: executionResult.stdout || "",
        stderr: executionResult.stderr || "",
        compilationOutput: executionResult.compilationOutput || "",
        executionTime: executionResult.executionTime || 0,
        exitCode: executionResult.exitCode || 0,
        passed: passed,
        success: executionResult.success && passed,
      });
    } catch (error) {
      console.error(`[${executionId}] Test case execution error:`, error);
      
      results.push({
        ...testCase,
        actualOutput: "",
        stderr: error.message,
        compilationOutput: "",
        executionTime: 0,
        exitCode: 1,
        passed: false,
        success: false,
      });
    }
  }

  // Sort results by order
  results.sort((a, b) => a.order - b.order);

  return results;
}

/**
 * Calculate the overall result of test case execution
 * 
 * @param {Array<Object>} testCaseResults - Array of test case results
 * @returns {Object} Overall result with statistics
 */
function calculateTestResults(testCaseResults) {
  const totalTests = testCaseResults.length;
  const passedTests = testCaseResults.filter(result => result.passed).length;
  const failedTests = totalTests - passedTests;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  
  // Calculate total and average execution time
  const totalExecutionTime = testCaseResults.reduce(
    (sum, result) => sum + (result.executionTime || 0), 
    0
  );
  const avgExecutionTime = totalTests > 0 ? totalExecutionTime / totalTests : 0;
  
  return {
    totalTests,
    passedTests,
    failedTests,
    successRate,
    totalExecutionTime,
    avgExecutionTime,
    allPassed: passedTests === totalTests,
  };
}

module.exports = {
  executeTestCases,
  calculateTestResults,
};