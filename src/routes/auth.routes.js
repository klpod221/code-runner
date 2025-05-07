const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/UserRegister'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request, username or email already in use
 *       403:
 *         description: Registration is disabled
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with existing user credentials
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/profile", verifyToken, authController.getProfile);

module.exports = router;
