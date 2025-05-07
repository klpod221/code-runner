const express = require("express");
const router = express.Router();
const healthController = require("../controllers/health.controller");

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check basic API health
 *     description: Returns a basic health status of the API
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   example: "2023-05-15T14:30:25.000Z"
 *                 uptime:
 *                   type: string
 *                   example: "1234.56 seconds"
 *                 serverInfo:
 *                   type: object
 *                 env:
 *                   type: string
 *                   example: development
 */
router.get("/", healthController.checkHealth);

/**
 * @swagger
 * /health/db:
 *   get:
 *     summary: Check database health
 *     description: Checks if the database connection is working properly
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Database is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 message:
 *                   type: string
 *                   example: "Database connection is working"
 *                 timestamp:
 *                   type: string
 *                   example: "2023-05-15T14:30:25.000Z"
 *                 dbInfo:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     host:
 *                       type: string
 *                     port:
 *                       type: number
 *                     dialect:
 *                       type: string
 *       503:
 *         description: Database is unhealthy
 */
router.get("/db", healthController.checkDbHealth);

/**
 * @swagger
 * /health/full:
 *   get:
 *     summary: Check full system health
 *     description: Returns detailed health information about all system components
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Full health report
 */
router.get("/full", healthController.checkFullHealth);

module.exports = router;