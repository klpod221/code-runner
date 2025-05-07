const express = require("express");
const router = express.Router();
const codeRunnerController = require("../controllers/codeRunner.controller");
const { verifyToken } = require("../middleware/auth.middleware");

/**
 * @swagger
 * /code/run:
 *   post:
 *     summary: Execute code in the specified language
 *     description: Run code in a supported language (NodeJS, Python, Java, C, or C++). Can handle both single file and multi-file code.
 *       Supports base64 encoded content for data integrity.
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
 *             properties:
 *               isBase64Encoded:
 *                 type: boolean
 *                 description: Set to true if code and file contents are base64 encoded
 *                 default: false
 *           examples:
 *             singleFile:
 *               summary: Single file code execution example
 *               value:
 *                 languageId: "550e8400-e29b-41d4-a716-446655440000"
 *                 code: "console.log('Hello, World!');"
 *                 stdin: ""
 *                 isBase64Encoded: false
 *             javaWithInput:
 *               summary: Java code execution with input example
 *               value:
 *                 languageId: "4fa69a1a-5b1f-4e1d-a3ba-a8afec213a0b"
 *                 code: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    System.out.println(\"Enter a number:\");\n    int number = scanner.nextInt();\n    System.out.println(\"You entered: \" + number);\n    System.out.println(\"Number doubled: \" + (number * 2));\n  }\n}"
 *                 stdin: "42"
 *                 isBase64Encoded: false
 *             multiFilesNodeJS:
 *               summary: Multi-file Node.js code execution example
 *               value:
 *                 languageId: "550e8400-e29b-41d4-a716-446655440000"
 *                 files:
 *                   - name: "main.js"
 *                     content: "const utils = require('./utils.js');\nconst calculator = require('./calculator.js');\n\nconsole.log(utils.formatNumber(calculator.add(5, 10)));"
 *                     isMain: true
 *                   - name: "utils.js"
 *                     content: "module.exports = {\n  formatNumber: (num) => `Result: ${num}`\n};"
 *                     isMain: false
 *                   - name: "calculator.js"
 *                     content: "module.exports = {\n  add: (a, b) => a + b,\n  subtract: (a, b) => a - b\n};"
 *                     isMain: false
 *                 stdin: ""
 *                 isBase64Encoded: false
 *             multiFilesJava:
 *               summary: Multi-file Java code execution example
 *               value:
 *                 languageId: "4fa69a1a-5b1f-4e1d-a3ba-a8afec213a0b"
 *                 files:
 *                   - name: "Main.java"
 *                     content: "public class Main {\n  public static void main(String[] args) {\n    Calculator calc = new Calculator();\n    Formatter fmt = new Formatter();\n    System.out.println(fmt.format(calc.add(15, 27)));\n  }\n}"
 *                     isMain: true
 *                   - name: "Calculator.java"
 *                     content: "public class Calculator {\n  public int add(int a, int b) {\n    return a + b;\n  }\n  \n  public int subtract(int a, int b) {\n    return a - b;\n  }\n}"
 *                     isMain: false
 *                   - name: "Formatter.java"
 *                     content: "public class Formatter {\n  public String format(int value) {\n    return \"Result: \" + value;\n  }\n}"
 *                     isMain: false
 *                 stdin: ""
 *                 isBase64Encoded: false
 *             multiFilesJavaWithInput:
 *               summary: Multi-file Java code execution with input example
 *               value:
 *                 languageId: "4fa69a1a-5b1f-4e1d-a3ba-a8afec213a0b"
 *                 files:
 *                   - name: "Main.java"
 *                     content: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    System.out.println(\"Enter two numbers:\");\n    int a = scanner.nextInt();\n    int b = scanner.nextInt();\n    \n    Calculator calc = new Calculator();\n    Formatter fmt = new Formatter();\n    \n    System.out.println(fmt.format(\"Addition\", calc.add(a, b)));\n    System.out.println(fmt.format(\"Subtraction\", calc.subtract(a, b)));\n  }\n}"
 *                     isMain: true
 *                   - name: "Calculator.java"
 *                     content: "public class Calculator {\n  public int add(int a, int b) {\n    return a + b;\n  }\n  \n  public int subtract(int a, int b) {\n    return a - b;\n  }\n}"
 *                     isMain: false
 *                   - name: "Formatter.java"
 *                     content: "public class Formatter {\n  public String format(String operation, int value) {\n    return operation + \" result: \" + value;\n  }\n}"
 *                     isMain: false
 *                 stdin: "10\n5"
 *                 isBase64Encoded: false
 *             multiFilesWithBase64:
 *               summary: Multi-file execution with base64 encoding
 *               value:
 *                 languageId: "550e8400-e29b-41d4-a716-446655440000"
 *                 files:
 *                   - name: "main.js"
 *                     content: "Y29uc3QgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7CmNvbnN0IGNhbGN1bGF0b3IgPSByZXF1aXJlKCcuL2NhbGN1bGF0b3IuanMnKTsKCmNvbnNvbGUubG9nKHV0aWxzLmZvcm1hdE51bWJlcihjYWxjdWxhdG9yLmFkZCg1LCAxMCkpKTs="
 *                     isMain: true
 *                   - name: "utils.js"
 *                     content: "bW9kdWxlLmV4cG9ydHMgPSB7CiAgZm9ybWF0TnVtYmVyOiAobnVtKSA9PiBgUmVzdWx0OiAke251bX1gCn07"
 *                     isMain: false
 *                   - name: "calculator.js"
 *                     content: "bW9kdWxlLmV4cG9ydHMgPSB7CiAgYWRkOiAoYSwgYikgPT4gYSArIGIsCiAgc3VidHJhY3Q6IChhLCBiKSA9PiBhIC0gYgp9Ow=="
 *                     isMain: false
 *                 stdin: ""
 *                 isBase64Encoded: true
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
 *             examples:
 *               successResponse:
 *                 value:
 *                   message: "Code execution completed"
 *                   result:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     stdout: "Result: 15\n"
 *                     stderr: ""
 *                     compilationOutput: ""
 *                     executionTime: 42
 *                     memoryUsage: 1024
 *                     exitCode: 0
 *                     success: true
 *               successJavaWithInputResponse:
 *                 value:
 *                   message: "Code execution completed"
 *                   result:
 *                     id: "4fa69a1a-5b1f-4e1d-a3ba-a8afec213a0b"
 *                     stdout: "Enter a number:\nYou entered: 42\nNumber doubled: 84\n"
 *                     stderr: ""
 *                     compilationOutput: ""
 *                     executionTime: 157
 *                     memoryUsage: 25600
 *                     exitCode: 0
 *                     success: true
 *       400:
 *         description: Bad request, invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Language not found or not supported
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/run", verifyToken, codeRunnerController.runCode);

/**
 * @swagger
 * /code/executions/{id}:
 *   get:
 *     summary: Get code execution by ID
 *     description: Retrieve details of a specific code execution
 *     tags: [Code Execution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the code execution to retrieve
 *     responses:
 *       200:
 *         description: Code execution retrieved successfully
 *       404:
 *         description: Code execution not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/executions/:id", verifyToken, codeRunnerController.getExecutionById);

/**
 * @swagger
 * /code/executions:
 *   get:
 *     summary: Get user's code execution history
 *     description: Retrieve the history of code executions for the authenticated user
 *     tags: [Code Execution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Code executions retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/executions", verifyToken, codeRunnerController.getUserExecutions);

module.exports = router;
