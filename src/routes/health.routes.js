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
 *               $ref: '#/components/schemas/HealthResponse'
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
 *               $ref: '#/components/schemas/DatabaseHealthResponse'
 *       503:
 *         description: Database is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 message:
 *                   type: string
 *                   example: "Database connection failed"
 *                 error:
 *                   type: string
 */
router.get("/db", healthController.checkDbHealth);

/**
 * @swagger
 * /health/languages:
 *   get:
 *     summary: Check programming languages health
 *     description: Checks if all the supported programming languages are available in the container
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Languages health status
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
 *                   format: date-time
 *                 languages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: nodejs
 *                       status:
 *                         type: string
 *                         example: available
 *                       version:
 *                         type: string
 *                         example: v20.10.0
 */
router.get("/languages", healthController.checkLanguagesHealth);

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FullHealthResponse'
 */
router.get("/full", healthController.checkFullHealth);

module.exports = router;