const path = require("path");
const fs = require("fs-extra");
const { exec } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const util = require("util");

const execPromise = util.promisify(exec);

// Supported languages configuration
const languageConfigs = {
  nodejs: {
    extension: ".js",
    compile: null,
    run: "node",
    timeout: parseInt(process.env.MAX_EXECUTION_TIME) || 10000,
  },
  python: {
    extension: ".py",
    compile: null,
    run: "python3",
    timeout: parseInt(process.env.MAX_EXECUTION_TIME) || 10000,
  },
  java: {
    extension: ".java",
    compile: (file) => `javac ${file}`,
    run: (className) => `java ${className}`,
    timeout: parseInt(process.env.MAX_EXECUTION_TIME) || 15000,
  },
  cpp: {
    extension: ".cpp",
    compile: (file) => `g++ -o ${file.replace(".cpp", "")} ${file}`,
    run: (file) => `./${file.replace(".cpp", "")}`,
    timeout: parseInt(process.env.MAX_EXECUTION_TIME) || 10000,
  },
  c: {
    extension: ".c",
    compile: (file) => `gcc -o ${file.replace(".c", "")} ${file}`,
    run: (file) => `./${file.replace(".c", "")}`,
    timeout: parseInt(process.env.MAX_EXECUTION_TIME) || 10000,
  },
};

/**
 * Execute code in the specified language
 *
 * @param {Object} options - Options for code execution
 * @param {string} options.language - Programming language name (nodejs, python, java, etc.)
 * @param {Array<Object>} options.files - Array of file objects { name, content, isMain }
 * @param {string} options.stdin - Standard input (optional)
 * @returns {Promise<Object>} Execution result
 */
async function executeCode({ language, files, stdin = "" }) {
  // Validate language support
  if (!languageConfigs[language]) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // Create a unique execution ID and temp directory
  const executionId = uuidv4();
  const tempDir = path.join("/tmp/code-execution", executionId);

  try {
    // Create temp directory
    await fs.mkdirp(tempDir);

    // Find the main file
    const mainFile = files.find((file) => file.isMain) || files[0];
    if (!mainFile) {
      throw new Error("No files provided");
    }

    // Write all files to the temp directory
    for (const file of files) {
      await fs.writeFile(path.join(tempDir, file.name), file.content);
    }

    // Write stdin to file if provided
    if (stdin) {
      await fs.writeFile(path.join(tempDir, "input.txt"), stdin);
    }

    // Get language configuration
    const config = languageConfigs[language];

    // Initialize result structure
    let result = {
      stdout: "",
      stderr: "",
      exitCode: 0,
      compilationOutput: "",
      executionTime: 0,
      memoryUsage: 0,
      success: false,
    };

    // Start time measurement
    const startTime = process.hrtime();

    // For compiled languages, compile the code first
    if (config.compile) {
      try {
        const compileCmd = config.compile(mainFile.name);
        console.log(`[${executionId}] Compiling: ${compileCmd}`);

        const { stdout, stderr } = await execPromise(compileCmd, {
          cwd: tempDir,
          timeout: config.timeout,
        });

        result.compilationOutput = stdout || "";

        // If stderr is not empty, there was a compilation error
        if (stderr) {
          result.stderr = stderr;
          result.exitCode = 1;
          result.success = false;
          return result;
        }
      } catch (error) {
        result.stderr = error.stderr || error.message;
        result.exitCode = error.code || 1;
        result.success = false;
        return result;
      }
    }

    // Execute the code
    try {
      let runCmd;

      if (language === "java") {
        // For Java, extract class name from file name
        const className = path.basename(mainFile.name, ".java");
        runCmd = config.run(className);
      } else if (config.compile) {
        // For other compiled languages
        runCmd = config.run(mainFile.name);
      } else {
        // For interpreted languages
        runCmd = `${config.run} ${mainFile.name}`;
      }

      // Add stdin redirection if provided
      if (stdin) {
        runCmd += ` < input.txt`;
      }

      console.log(`[${executionId}] Executing: ${runCmd}`);

      const { stdout, stderr } = await execPromise(runCmd, {
        cwd: tempDir,
        timeout: config.timeout,
      });

      // Calculate execution time
      const endTime = process.hrtime(startTime);
      const executionTimeMs = Math.round(
        endTime[0] * 1000 + endTime[1] / 1000000
      );

      result.stdout = stdout || "";
      result.stderr = stderr || "";
      result.executionTime = executionTimeMs;
      result.exitCode = 0;
      result.success = true;

      // Memory usage calculation is not precise in this approach
      // A more accurate approach would be to use resource monitoring
      result.memoryUsage = 0;
    } catch (error) {
      // Calculate execution time even if there was an error
      const endTime = process.hrtime(startTime);
      const executionTimeMs = Math.round(
        endTime[0] * 1000 + endTime[1] / 1000000
      );

      result.stdout = error.stdout || "";
      result.stderr = error.stderr || error.message;
      result.executionTime = executionTimeMs;
      result.exitCode = error.code || 1;
      result.success = false;

      if (error.signal === "SIGTERM" || error.killed) {
        result.stderr += "\nExecution timed out";
      }
    }

    return result;
  } catch (error) {
    throw error;
  } finally {
    // Clean up the temporary directory
    try {
      await fs.remove(tempDir);
    } catch (error) {
      console.error(`Failed to clean up temp directory: ${error.message}`);
    }
  }
}

module.exports = {
  executeCode,
  supportedLanguages: Object.keys(languageConfigs),
};
