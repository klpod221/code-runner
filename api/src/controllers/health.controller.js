const { sequelize } = require("../models");
const os = require("os");
const { supportedLanguages } = require("../services/codeExecutor.service");
const languageHealthService = require("../services/languageHealth.service");

// Check general server health
exports.checkHealth = async (req, res) => {
  try {
    // Basic health information
    const healthInfo = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime() + " seconds",
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          total: Math.round(os.totalmem() / (1024 * 1024)) + " MB",
          free: Math.round(os.freemem() / (1024 * 1024)) + " MB",
          used: Math.round((os.totalmem() - os.freemem()) / (1024 * 1024)) + " MB",
        },
        cpuUsage: process.cpuUsage(),
        hostname: os.hostname(),
        loadAvg: os.loadavg(),
      },
      env: process.env.NODE_ENV,
    };

    res.status(200).json(healthInfo);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error checking health",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Check database connectivity
exports.checkDbHealth = async (req, res) => {
  try {
    await sequelize.authenticate();
    
    res.status(200).json({
      status: "healthy",
      message: "Database connection is working",
      timestamp: new Date().toISOString(),
      dbInfo: {
        name: sequelize.config.database,
        host: sequelize.config.host,
        port: sequelize.config.port,
        dialect: sequelize.options.dialect,
      }
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      message: "Database connection failed",
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Check programming languages availability
exports.checkLanguagesHealth = async (req, res) => {
  try {
    const languageHealth = await languageHealthService.getLanguageSystemHealth();
    res.status(200).json(languageHealth);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error checking language health",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Check all system components
exports.checkFullHealth = async (req, res) => {
  try {
    // Check database connection
    let dbStatus = "healthy";
    let dbMessage = "Database connection is working";
    let dbError = null;
    
    try {
      await sequelize.authenticate();
    } catch (error) {
      dbStatus = "unhealthy";
      dbMessage = "Database connection failed";
      dbError = error.message;
    }
    
    // Check programming languages
    const languageHealth = await languageHealthService.checkAllLanguagesHealth();
    
    // System metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);
    
    // CPU load average
    const cpuLoad = os.loadavg();
    
    // Full health report
    const healthReport = {
      status: dbStatus === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime() / 3600)} hours, ${Math.floor((process.uptime() % 3600) / 60)} minutes, ${Math.floor(process.uptime() % 60)} seconds`,
      components: {
        database: {
          status: dbStatus,
          message: dbMessage,
          error: dbError,
          info: {
            name: sequelize.config.database,
            host: sequelize.config.host,
            dialect: sequelize.options.dialect,
          }
        },
        languages: {
          status: languageHealth.every(l => l.status === "available") ? "healthy" : "degraded",
          details: languageHealth
        },
        server: {
          status: "healthy",
          nodeVersion: process.version,
          environment: process.env.NODE_ENV,
        }
      },
      system: {
        hostname: os.hostname(),
        platform: process.platform,
        arch: process.arch,
        cpus: os.cpus().length,
        loadAverage: {
          "1min": cpuLoad[0].toFixed(2),
          "5min": cpuLoad[1].toFixed(2),
          "15min": cpuLoad[2].toFixed(2),
        },
        memory: {
          total: `${Math.round(totalMemory / (1024 * 1024))} MB`,
          free: `${Math.round(freeMemory / (1024 * 1024))} MB`,
          used: `${Math.round(usedMemory / (1024 * 1024))} MB`,
          usagePercent: `${memoryUsagePercent}%`,
        },
      }
    };
    
    res.status(200).json(healthReport);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error checking health",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};