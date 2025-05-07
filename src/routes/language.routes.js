const express = require("express");
const router = express.Router();
const languageController = require("../controllers/language.controller");

/**
 * @swagger
 * /languages:
 *   get:
 *     summary: Get all supported languages
 *     tags: [Languages]
 *     security: []
 *     responses:
 *       200:
 *         description: Languages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LanguageListResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", languageController.getAllLanguages);

/**
 * @swagger
 * /languages/{id}:
 *   get:
 *     summary: Get language by ID
 *     tags: [Languages]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: UUID of the language to get
 *     responses:
 *       200:
 *         description: Language retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LanguageDetailResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id", languageController.getLanguageById);

module.exports = router;
