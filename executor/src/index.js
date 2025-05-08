require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const codeExecutionRoutes = require('./routes/codeExecution.routes');
const healthRoutes = require('./routes/health.routes');

// Initialize express
const app = express();

// Set port
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Routes
app.use('/execute', codeExecutionRoutes);
app.use('/execute/health', healthRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Code Executor Service',
    status: 'running',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'code-runner-executor' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Code Executor service running on port ${PORT}`);
});

// Export app for testing
module.exports = app;