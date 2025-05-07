const { CodeExecution, Language } = require("../models");
const { executeCode } = require("../services/codeExecutor.service");

// Execute code
exports.runCode = async (req, res) => {
  try {
    const { languageId, code, stdin, files, isBase64Encoded = false } = req.body;
    const userId = req.user.id;

    console.log(`[${req.id}] Processing code execution request. Language ID: ${languageId}`);

    // Validate request body
    if (!languageId) {
      return res.status(400).json({
        message: "Language ID is required",
      });
    }

    if (!code && (!files || !Array.isArray(files) || files.length === 0)) {
      return res.status(400).json({
        message: "Either code or files must be provided",
      });
    }

    // Validate language
    const language = await Language.findOne({
      where: { id: languageId, isActive: true },
    });

    if (!language) {
      return res.status(404).json({
        message: "Language not found or not supported",
      });
    }

    console.log(`[${req.id}] Processing code execution for language: ${language.name}`);

    // Create a record in database
    const codeExecution = await CodeExecution.create({
      userId,
      languageId,
      code:
        Array.isArray(files) && files.length > 0 ? JSON.stringify(files) : code,
      stdin: stdin || "",
      status: "pending",
    });

    console.log(`[${req.id}] Created code execution record with ID: ${codeExecution.id}`);

    // Prepare files for execution
    let filesToExecute = [];
    try {
      if (Array.isArray(files) && files.length > 0) {
        // Multiple files - process files array
        filesToExecute = files.map((file) => ({
          name: file.name,
          content: isBase64Encoded ? Buffer.from(file.content, 'base64').toString('utf-8') : file.content,
          isMain: !!file.isMain,
        }));

        // Verify at least one main file
        const mainFile = filesToExecute.find(file => file.isMain);
        if (!mainFile) {
          filesToExecute[0].isMain = true; // Set first file as main if none specified
          console.log(`[${req.id}] No main file specified, setting ${filesToExecute[0].name} as main`);
        }
      } else {
        // Single file code
        const fileName = `main${language.extension}`;
        const decodedCode = isBase64Encoded ? Buffer.from(code, 'base64').toString('utf-8') : code;
        filesToExecute = [
          {
            name: fileName,
            content: decodedCode,
            isMain: true,
          },
        ];
      }

      console.log(`[${req.id}] Prepared ${filesToExecute.length} file(s) for execution`);
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
    let decodedStdin = stdin;
    if (isBase64Encoded && stdin) {
      try {
        decodedStdin = Buffer.from(stdin, 'base64').toString('utf-8');
      } catch (stdinError) {
        console.error(`[${req.id}] Error decoding stdin: ${stdinError.message}`);
        await codeExecution.update({
          status: "failed",
          error: `Failed to decode stdin: ${stdinError.message}`,
        });
        
        return res.status(400).json({
          message: "Error decoding stdin",
          error: stdinError.message,
        });
      }
    }

    // Execute code
    try {
      console.log(`[${req.id}] Executing ${language.name} code...`);
      
      const result = await executeCode({
        language: language.name,
        files: filesToExecute,
        stdin: decodedStdin || "",
      });

      console.log(`[${req.id}] Code execution completed with status: ${result.success ? 'success' : 'failure'}`);

      // Update the code execution record
      await codeExecution.update({
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        compilationOutput: result.compilationOutput || "",
        executionTime: result.executionTime || 0,
        memoryUsage: result.memoryUsage || 0,
        exitCode: result.exitCode || 0,
        status: result.success ? "completed" : "failed",
        error: result.success ? "" : (result.stderr || "Execution failed"),
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
      console.error(`[${req.id}] Error during code execution: ${error.message}`);
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
