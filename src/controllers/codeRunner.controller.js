const { CodeExecution, Language, testCase } = require("../models");
const { executeCode } = require("../services/codeExecutor.service");
const {
  executeTestCases,
  calculateTestResults,
} = require("../services/testCase.service");

// Helper functions for code execution
const validateLanguage = async (languageId) => {
  if (!languageId) {
    return { isValid: false, status: 400, message: "Language ID is required" };
  }

  const language = await Language.findOne({
    where: { id: languageId, isActive: true },
  });

  if (!language) {
    return { 
      isValid: false, 
      status: 404, 
      message: "Language not found or not supported" 
    };
  }

  return { isValid: true, language };
};

const validateCodeInput = (code, files) => {
  if (!code && (!files || !Array.isArray(files) || files.length === 0)) {
    return { isValid: false, status: 400, message: "Either code or files must be provided" };
  }
  return { isValid: true };
};

const prepareFilesForExecution = (language, code, files, isBase64Encoded) => {
  let filesToExecute = [];
  
  if (Array.isArray(files) && files.length > 0) {
    // Multiple files - process files array
    filesToExecute = files.map((file) => ({
      name: file.name,
      content: isBase64Encoded
        ? Buffer.from(file.content, "base64").toString("utf-8")
        : file.content,
      isMain: !!file.isMain,
    }));

    // Verify at least one main file
    const mainFile = filesToExecute.find((file) => file.isMain);
    if (!mainFile) {
      filesToExecute[0].isMain = true; // Set first file as main if none specified
    }
  } else {
    // Single file code
    let fileName;

    // check if is java then set the file name to Main.java
    if (language.name === "java") {
      fileName = "Main.java";
    } else {
      fileName = `main${language.extension}`;
    }

    const decodedCode = isBase64Encoded
      ? Buffer.from(code, "base64").toString("utf-8")
      : code;
    filesToExecute = [
      {
        name: fileName,
        content: decodedCode,
        isMain: true,
      },
    ];
  }

  return filesToExecute;
};

const decodeInput = (input, isBase64Encoded) => {
  if (isBase64Encoded && input) {
    try {
      return Buffer.from(input, "base64").toString("utf-8");
    } catch (error) {
      throw new Error(`Failed to decode input: ${error.message}`);
    }
  }
  return input;
};

// Execute code
exports.runCode = async (req, res) => {
  try {
    const {
      languageId,
      code,
      stdin,
      files,
      isBase64Encoded = false,
      isPersistent = false, // Parameter to mark execution as persistent
    } = req.body;
    const userId = req.user.id;

    console.log(
      `[${req.id}] Processing code execution request. Language ID: ${languageId}`
    );

    // Validate request body
    const codeValidation = validateCodeInput(code, files);
    if (!codeValidation.isValid) {
      return res.status(codeValidation.status).json({
        message: codeValidation.message,
      });
    }

    // Validate language
    const languageValidation = await validateLanguage(languageId);
    if (!languageValidation.isValid) {
      return res.status(languageValidation.status).json({
        message: languageValidation.message,
      });
    }
    
    const language = languageValidation.language;

    console.log(
      `[${req.id}] Processing code execution for language: ${language.name}`
    );

    // Create a record in database
    const codeExecution = await CodeExecution.create({
      userId,
      languageId,
      code:
        Array.isArray(files) && files.length > 0 ? JSON.stringify(files) : code,
      stdin: stdin || "",
      status: "pending",
      isPersistent: Boolean(isPersistent), // Set the persistence flag
    });

    console.log(
      `[${req.id}] Created code execution record with ID: ${codeExecution.id}${isPersistent ? ' (persistent)' : ''}`
    );

    // Prepare files for execution
    let filesToExecute = [];
    try {
      filesToExecute = prepareFilesForExecution(language, code, files, isBase64Encoded);
      console.log(
        `[${req.id}] Prepared ${filesToExecute.length} file(s) for execution`
      );
    } catch (fileError) {
      console.error(`[${req.id}] Error preparing files: ${fileError.message}`);
      await codeExecution.update({
        status: "failed",
        error: `Failed to prepare files: ${fileError.message}`,
      });

      return res.status(400).json({
        message: "Error preparing files for execution",
        error: fileError.message,
      });
    }

    // Decode stdin if it's base64 encoded
    let decodedStdin;
    try {
      decodedStdin = decodeInput(stdin, isBase64Encoded);
    } catch (stdinError) {
      console.error(
        `[${req.id}] Error decoding stdin: ${stdinError.message}`
      );
      await codeExecution.update({
        status: "failed",
        error: `Failed to decode stdin: ${stdinError.message}`,
      });

      return res.status(400).json({
        message: "Error decoding stdin",
        error: stdinError.message,
      });
    }

    // Execute code
    try {
      console.log(`[${req.id}] Executing ${language.name} code...`);

      const result = await executeCode({
        language: language.name,
        files: filesToExecute,
        stdin: decodedStdin || "",
      });

      console.log(
        `[${req.id}] Code execution completed with status: ${
          result.success ? "success" : "failure"
        }`
      );

      // Update the code execution record
      await codeExecution.update({
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        compilationOutput: result.compilationOutput || "",
        executionTime: result.executionTime || 0,
        memoryUsage: result.memoryUsage || 0,
        exitCode: result.exitCode || 0,
        status: result.success ? "completed" : "failed",
        error: result.success ? "" : result.stderr || "Execution failed",
      });

      res.status(200).json({
        message: "Code execution completed",
        result: {
          id: codeExecution.id,
          stdout: result.stdout || "",
          stderr: result.stderr || "",
          compilationOutput: result.compilationOutput || "",
          executionTime: result.executionTime || 0,
          memoryUsage: result.memoryUsage || 0,
          exitCode: result.exitCode || 0,
          success: result.success,
        },
      });
    } catch (error) {
      console.error(
        `[${req.id}] Error during code execution: ${error.message}`
      );
      console.error(error.stack);

      await codeExecution.update({
        status: "failed",
        error: error.message || "Execution failed",
      });

      res.status(500).json({
        message: "Code execution failed",
        error: error.message,
      });
    }
  } catch (error) {
    console.error(`Unexpected error in runCode: ${error.message}`);
    console.error(error.stack);

    res.status(500).json({
      message: "Error executing code",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Execute code with test cases
exports.runTestCases = async (req, res) => {
  try {
    const {
      languageId,
      code,
      files,
      testCases,
      isBase64Encoded = false,
      isPersistent = false, // New parameter to mark execution as persistent
    } = req.body;
    const userId = req.user.id;

    console.log(
      `[${req.id}] Processing test case execution request. Language ID: ${languageId}`
    );

    // Validate request body
    const codeValidation = validateCodeInput(code, files);
    if (!codeValidation.isValid) {
      return res.status(codeValidation.status).json({
        message: codeValidation.message,
      });
    }

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        message: "Test cases are required",
      });
    }

    // Validate test cases format
    for (let i = 0; i < testCases.length; i++) {
      if (testCases[i].expectedOutput === undefined) {
        return res.status(400).json({
          message: `Test case #${i + 1} is missing expectedOutput`,
        });
      }

      // Ensure each test case has an order
      if (testCases[i].order === undefined) {
        testCases[i].order = i;
      }
    }

    // Validate language
    const languageValidation = await validateLanguage(languageId);
    if (!languageValidation.isValid) {
      return res.status(languageValidation.status).json({
        message: languageValidation.message,
      });
    }
    
    const language = languageValidation.language;

    console.log(
      `[${req.id}] Processing test case execution for language: ${language.name}`
    );

    // Create a record in database
    const codeExecution = await CodeExecution.create({
      userId,
      languageId,
      code:
        Array.isArray(files) && files.length > 0 ? JSON.stringify(files) : code,
      stdin: "",
      status: "pending",
      isPersistent: Boolean(isPersistent), // Set the persistence flag
    });

    console.log(
      `[${req.id}] Created code execution record with ID: ${codeExecution.id}${isPersistent ? ' (persistent)' : ''}`
    );

    // Prepare files for execution
    let filesToExecute = [];
    try {
      filesToExecute = prepareFilesForExecution(language, code, files, isBase64Encoded);
      console.log(
        `[${req.id}] Prepared ${filesToExecute.length} file(s) for test case execution`
      );
    } catch (fileError) {
      console.error(`[${req.id}] Error preparing files: ${fileError.message}`);
      await codeExecution.update({
        status: "failed",
        error: `Failed to prepare files: ${fileError.message}`,
      });

      return res.status(400).json({
        message: "Error preparing files for execution",
        error: fileError.message,
      });
    }

    // Process test cases
    let processedTestCases = testCases.map((tc) => {
      try {
        const input = decodeInput(tc.input, isBase64Encoded) || "";
        const expectedOutput = decodeInput(tc.expectedOutput, isBase64Encoded);

        return {
          input,
          expectedOutput,
          order: tc.order !== undefined ? tc.order : 0,
        };
      } catch (decodeError) {
        throw new Error(`Failed to decode test case: ${decodeError.message}`);
      }
    });

    // Execute test cases
    try {
      console.log(
        `[${req.id}] Executing ${processedTestCases.length} test cases for ${language.name} code...`
      );

      const testResults = await executeTestCases({
        language: language.name,
        files: filesToExecute,
        testCases: processedTestCases,
        requestId: req.id,
      });

      // Calculate overall results
      const overallResults = calculateTestResults(testResults);

      console.log(
        `[${req.id}] Test case execution completed. Passed: ${overallResults.passedTests}/${overallResults.totalTests}`
      );

      // Save test case results to database
      const savedTestCases = [];
      for (const result of testResults) {
        const testCaseRecord = await testCase.create({
          codeExecutionId: codeExecution.id,
          input: result.input || "",
          expectedOutput: result.expectedOutput,
          actualOutput: result.actualOutput || "",
          passed: result.passed,
          executionTime: result.executionTime || 0,
          order: result.order || 0,
        });
        savedTestCases.push(testCaseRecord);
      }

      // Update the code execution record
      await codeExecution.update({
        status: "completed",
        executionTime: overallResults.totalExecutionTime,
      });

      res.status(200).json({
        message: "Test case execution completed",
        result: {
          id: codeExecution.id,
          testCases: testResults,
          summary: overallResults,
        },
      });
    } catch (error) {
      console.error(
        `[${req.id}] Error during test case execution: ${error.message}`
      );
      console.error(error.stack);

      await codeExecution.update({
        status: "failed",
        error: error.message || "Test case execution failed",
      });

      res.status(500).json({
        message: "Test case execution failed",
        error: error.message,
      });
    }
  } catch (error) {
    console.error(`Unexpected error in runTestCases: ${error.message}`);
    console.error(error.stack);

    res.status(500).json({
      message: "Error executing test cases",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get code execution by ID
exports.getExecutionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const codeExecution = await CodeExecution.findOne({
      where: { id, userId },
      include: [
        {
          model: Language,
          as: "language",
          attributes: ["id", "name", "displayName", "extension"],
        },
      ],
    });

    if (!codeExecution) {
      return res.status(404).json({
        message: "Code execution not found",
      });
    }

    res.status(200).json({
      message: "Code execution retrieved successfully",
      execution: codeExecution,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving code execution",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get test case results for a code execution
exports.getTestCaseResults = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the code execution
    const codeExecution = await CodeExecution.findOne({
      where: { id, userId },
      include: [
        {
          model: Language,
          as: "language",
          attributes: ["id", "name", "displayName", "extension"],
        },
      ],
    });

    if (!codeExecution) {
      return res.status(404).json({
        message: "Code execution not found",
      });
    }

    // Get test cases
    const testCases = await testCase.findAll({
      where: { codeExecutionId: id },
      order: [["order", "ASC"]],
    });

    // Calculate summary
    const summary = calculateTestResults(
      testCases.map((tc) => ({
        passed: tc.passed,
        executionTime: tc.executionTime,
      }))
    );

    res.status(200).json({
      message: "Test case results retrieved successfully",
      execution: codeExecution,
      testCases,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving test case results",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get user's code execution history
exports.getUserExecutions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const executions = await CodeExecution.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Language,
          as: "language",
          attributes: ["id", "name", "displayName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      message: "Code executions retrieved successfully",
      executions: executions.rows,
      totalCount: executions.count,
      totalPages: Math.ceil(executions.count / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving code executions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update isPersistent flag for a code execution
exports.updatePersistence = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPersistent } = req.body;
    const userId = req.user.id;

    // Validate input
    if (isPersistent === undefined) {
      return res.status(400).json({
        message: "isPersistent flag is required in the request body",
      });
    }

    // Find the code execution to update
    const codeExecution = await CodeExecution.findOne({
      where: { id, userId },
    });

    if (!codeExecution) {
      return res.status(404).json({
        message: "Code execution not found",
      });
    }

    // Update the isPersistent flag
    await codeExecution.update({ isPersistent: Boolean(isPersistent) });

    console.log(
      `[${req.id}] Updated persistence flag to ${isPersistent} for execution ${id} by user ${userId}`
    );

    res.status(200).json({
      message: "Persistence flag updated successfully",
      execution: {
        id: codeExecution.id,
        isPersistent: codeExecution.isPersistent,
      },
    });
  } catch (error) {
    console.error(`[${req.id}] Error updating persistence flag:`, error);
    
    res.status(500).json({
      message: "Error updating persistence flag",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
