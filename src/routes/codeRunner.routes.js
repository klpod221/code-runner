const express = require('express');
const router = express.Router();
const codeRunnerController = require('../controllers/codeRunner.controller');
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /code/run:
 *   post:
 *     summary: Execute code in the specified language
 *     description: Run code in a supported language (NodeJS, Python, Java, C, or C++). Can handle both single file and multi-file code.
 *     tags: [Code Execution]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/requestBodies/SingleFileCodeExecution/content/application~1json/schema'
 *               - $ref: '#/components/requestBodies/MultiFileCodeExecution/content/application~1json/schema'
 *     responses:
 *       200:
 *         description: Code execution completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     stdout:
 *                       type: string
 *                     stderr:
 *                       type: string
 *                     compilationOutput:
 *                       type: string
 *                     executionTime:
 *                       type: integer
 *                     memoryUsage:
 *                       type: integer
 *                     exitCode:
 *                       type: integer
 *                     success:
 *                       type: boolean
 *       400:
 *         description: Bad request, invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Language not found or not supported
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/run', verifyToken, codeRunnerController.runCode);

/**
 * @swagger
 * /code/execution/{id}:
 *   get:
 *     summary: Get code execution details by ID
 *     tags: [Code Execution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: UUID of the code execution to retrieve
 *     responses:
 *       200:
 *         description: Code execution retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 execution:
 *                   $ref: '#/components/schemas/CodeExecution'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/execution/:id', verifyToken, codeRunnerController.getExecutionById);

/**
 * @swagger
 * /code/history:
 *   get:
 *     summary: Get user's code execution history
 *     tags: [Code Execution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Code executions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 executions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CodeExecution'
 *                 totalCount:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/history', verifyToken, codeRunnerController.getUserExecutions);

module.exports = router;