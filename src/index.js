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

const authRoutes = require("./routes/auth.routes");
const codeRunnerRoutes = require("./routes/codeRunner.routes");
const languageRoutes = require("./routes/language.routes");
const healthRoutes = require("./routes/health.routes");
const { sequelize } = require("./models");
const { initLanguages } = require("./config/dbInit");

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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

app.use(cors(corsOptions));

// Custom logging format that includes the request ID
morgan.token('requestId', function (req) {
  return req.id;
});

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

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // Convert minutes to milliseconds
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: "Too many requests from this IP, please try again later",
});
app.use(limiter);

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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/code", codeRunnerRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/health", healthRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Code Runner API",
    docs: `${req.protocol}://${req.get("host")}/api-docs`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
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

    // Initialize automatic cleanup if enabled
    if (process.env.ENABLE_AUTO_CLEANUP !== 'false') {
      const cronSchedule = process.env.CLEANUP_CRON_SCHEDULE || '0 0 * * *'; // Default: daily at midnight
      scheduleCleanup(cronSchedule);
      console.log(`Automated execution cleanup scheduled with cron: ${cronSchedule}`);
    } else {
      console.log('Automated execution cleanup is disabled');
    }

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
