const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get all application settings
 *     description: Retrieves all configurable application settings (admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 settings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                       value:
 *                         type: string
 *                       description:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden, requires admin privileges
 */
router.get("/", verifyToken, isAdmin, settingsController.getAllSettings);

/**
 * @swagger
 * /settings/categories:
 *   get:
 *     summary: Get settings organized by category
 *     description: Retrieves all settings organized into logical categories (admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 settings:
 *                   type: object
 *                   properties:
 *                     registration:
 *                       type: object
 *                     rateLimit:
 *                       type: object
 *                     cleanup:
 *                       type: object
 *                     other:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden, requires admin privileges
 */
router.get("/categories", verifyToken, isAdmin, settingsController.getSettingsByCategory);

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Update an application setting
 *     description: Updates a specific application setting (admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, value]
 *             properties:
 *               key:
 *                 type: string
 *                 description: The setting key to update
 *               value:
 *                 type: string
 *                 description: The new setting value
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 setting:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *                     description:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request, invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden, requires admin privileges
 *       404:
 *         description: Setting not found
 */
router.put("/", verifyToken, isAdmin, settingsController.updateSetting);

module.exports = router;