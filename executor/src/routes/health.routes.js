const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const codeExecutorService = require("../services/codeExecutor.service");

/**
 * Check health for a specific language
 * @route GET /health/language/:language
 */
router.get("/language/:language", async (req, res) => {
  try {
    const { language } = req.params;
    const supportedLanguages = codeExecutorService.getSupportedLanguages();

    // Check if language is supported
    if (!supportedLanguages.includes(language)) {
      return res.status(404).json({
        name: language,
        status: "unknown",
        error: "Language not supported",
      });
    }

    // Default health status
    const healthStatus = {
      name: language,
      status: "available",
      version: null,
      details: null,
    };

    // Check language version and availability
    try {
      switch (language) {
        case "nodejs":
          const nodeResult = await execPromise("node --version");
          healthStatus.version = nodeResult.stdout.trim();
          break;
        case "python":
          const pythonResult = await execPromise("python3 --version");
          healthStatus.version = pythonResult.stdout.trim();
          break;
        case "java":
          const javaResult = await execPromise("java -version 2>&1");
          const javaVersion = javaResult.stderr.toString().split("\n")[0];
          healthStatus.version = javaVersion.trim();
          break;
        case "cpp":
          const cppResult = await execPromise("g++ --version");
          healthStatus.version = cppResult.stdout.toString().split("\n")[0];
          break;
        case "c":
          const cResult = await execPromise("gcc --version");
          healthStatus.version = cResult.stdout.toString().split("\n")[0];
          break;
      }
    } catch (error) {
      healthStatus.status = "unavailable";
      healthStatus.details = error.message;
    }

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      error: "Failed to check language health",
      details: error.message,
    });
  }
});

/**
 * Check health for all supported languages
 * @route GET /health/languages
 */
router.get("/languages", async (req, res) => {
  try {
    const supportedLanguages = codeExecutorService.getSupportedLanguages();
    const languageStatuses = [];

    // Check each language
    for (const language of supportedLanguages) {
      const healthStatus = {
        name: language,
        status: "available",
        version: null,
        details: null,
      };

      try {
        switch (language) {
          case "nodejs":
            const nodeResult = await execPromise("node --version");
            healthStatus.version = nodeResult.stdout.trim();
            break;
          case "python":
            const pythonResult = await execPromise("python3 --version");
            healthStatus.version = pythonResult.stdout.trim();
            break;
          case "java":
            const javaResult = await execPromise("java -version 2>&1");
            const javaVersion = javaResult.stderr.toString().split("\n")[0];
            healthStatus.version = javaVersion.trim();
            break;
          case "cpp":
            const cppResult = await execPromise("g++ --version");
            healthStatus.version = cppResult.stdout.toString().split("\n")[0];
            break;
          case "c":
            const cResult = await execPromise("gcc --version");
            healthStatus.version = cResult.stdout.toString().split("\n")[0];
            break;
        }
      } catch (error) {
        healthStatus.status = "unavailable";
        healthStatus.details = error.message;
      }

      languageStatuses.push(healthStatus);
    }

    // Count unavailable languages
    const unavailableCount = languageStatuses.filter(
      (lang) => lang.status !== "available"
    ).length;

    // Overall health status
    const healthReport = {
      status: unavailableCount === 0 ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      detail:
        unavailableCount === 0
          ? "All languages are available"
          : `${unavailableCount} language(s) unavailable`,
      languages: languageStatuses,
    };

    res.status(200).json(healthReport);
  } catch (error) {
    res.status(500).json({
      error: "Failed to check languages health",
      details: error.message,
    });
  }
});

/**
 * General health check
 * @route GET /health
 */
router.get("/", (req, res) => {
  const healthInfo = {
    status: "healthy",
    service: "executor",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  };

  res.status(200).json(healthInfo);
});

module.exports = router;
