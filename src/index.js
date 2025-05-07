require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const requestIdMiddleware = require("./middleware/requestId.middleware");
const { scheduleCleanup } = require("./services/cleanup.service");
const settingsService = require("./services/settings.service");

const authRoutes = require("./routes/auth.routes");
const codeRunnerRoutes = require("./routes/codeRunner.routes");
const languageRoutes = require("./routes/language.routes");
const healthRoutes = require("./routes/health.routes");
const settingsRoutes = require("./routes/settings.routes");
const { sequelize } = require("./models");
const { initLanguages } = require("./config/languagesInit");
const { initSettings } = require("./config/settingsInit");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Add request ID middleware early in the chain
app.use(requestIdMiddleware);

// Security middlewares
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
  })
);

// Configure CORS properly
const corsOptions = {
  origin: true, // This reflects the request origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Length", "X-Request-Id"],
};
app.use(cors(corsOptions));

// Request logging with Morgan
// Register the custom token for request ID
morgan.token('requestId', (req) => req.id);

app.use(morgan(function (tokens, req, res) {
  return [
    `[${tokens.requestId(req, res)}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens['response-time'](req, res), 'ms'
  ].join(' ');
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Dynamic rate limiter that gets settings from the database
// Will be updated when settings change
const configureLimiter = async () => {
  try {
    const windowMins = await settingsService.getNumericSetting("RATE_LIMIT_WINDOW", 15);
    const maxRequests = await settingsService.getNumericSetting("RATE_LIMIT_MAX", 100);
    
    // Use configured limiter for subsequent requests
    return rateLimit({
      windowMs: windowMins * 60 * 1000, // Convert minutes to milliseconds
      max: maxRequests,
      message: "Too many requests from this IP, please try again later",
    });
  } catch (error) {
    console.error("Error configuring rate limiter:", error);
    // Use default limiter if settings can't be loaded
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later",
    });
  }
};

// API Documentation with Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Code Runner API Documentation",
  })
);

// Create API router
const apiRouter = express.Router();

// Routes
apiRouter.use("/auth", authRoutes);
apiRouter.use("/code", codeRunnerRoutes);
apiRouter.use("/languages", languageRoutes);
apiRouter.use("/health", healthRoutes);
apiRouter.use("/settings", settingsRoutes);

// Apply API routes with prefix
app.use("/api", apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: "Not Found - The requested resource does not exist",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[${req.id}] Error:`, err);
  res.status(err.status || 500).json({
    message: "Server error occurred",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start the server
async function startServer() {
  try {
    // Sync database
    await sequelize.sync();
    console.log("Database connected successfully");

    // Initialize database with default data
    await initLanguages();
    
    // Initialize settings
    await initSettings();

    // Configure rate limiter using settings
    const limiter = await configureLimiter();
    app.use(limiter);
    
    // Periodically refresh rate limiter settings
    setInterval(async () => {
      const newLimiter = await configureLimiter();
      app._router.stack.forEach((layer, index) => {
        if (layer.name === 'rateLimit') {
          app._router.stack[index] = newLimiter;
        }
      });
      console.log('Rate limiter settings refreshed');
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    // Initialize automatic cleanup using settings
    scheduleCleanup();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(
        `API Documentation available at http://localhost:${PORT}/api-docs`
      );
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
}

startServer();
