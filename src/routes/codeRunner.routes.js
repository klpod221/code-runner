const express = require("express");
const router = express.Router();
const codeRunnerController = require("../controllers/codeRunner.controller");
const cleanupController = require("../controllers/cleanup.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

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
 *               $ref: '#/components/schemas/CodeExecutionResponse'
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
 * /code/run-tests:
 *   post:
 *     summary: Execute code against multiple test cases
 *     description: Run code in a supported language and verify against multiple test cases.
 *       Each test case defines input and expected output values to check correctness.
 *     tags: [Code Execution]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/TestCaseExecution'
 *       content:
 *         application/json:
 *           examples:
 *             basicTestCases:
 *               summary: Test cases for Node.js
 *               value:
 *                 languageId: "550e8400-e29b-41d4-a716-446655440000"
 *                 code: "process.stdin.on('data', (chunk) => {\n  const input = chunk.toString().trim().split(' ');\n  const a = parseInt(input[0]);\n  const b = parseInt(input[1]);\n  console.log(a + b);\n});"
 *                 testCases:
 *                   - input: "5 7"
 *                     expectedOutput: "12"
 *                     order: 0
 *                   - input: "10 -5"
 *                     expectedOutput: "5"
 *                     order: 1
 *                   - input: "0 0"
 *                     expectedOutput: "0"
 *                     order: 2
 *                 isBase64Encoded: false
 *             pythonExample:
 *               summary: Test cases for Python
 *               value:
 *                 languageId: "4b969211-d468-4527-9d70-4a8cb53f13af"
 *                 code: "a, b = map(int, input().split())\nprint(a + b)"
 *                 testCases:
 *                   - input: "5 7"
 *                     expectedOutput: "12"
 *                     order: 0
 *                   - input: "10 -5"
 *                     expectedOutput: "5"
 *                     order: 1
 *                 isBase64Encoded: false
 *             javaExample:
 *               summary: Test cases for Java
 *               value:
 *                 languageId: "4fa69a1a-5b1f-4e1d-a3ba-a8afec213a0b"
 *                 code: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int a = scanner.nextInt();\n    int b = scanner.nextInt();\n    System.out.println(a + b);\n  }\n}"
 *                 testCases:
 *                   - input: "5 7"
 *                     expectedOutput: "12"
 *                     order: 0
 *                   - input: "10 -5"
 *                     expectedOutput: "5"
 *                     order: 1
 *                 isBase64Encoded: false
 *     responses:
 *       200:
 *         description: Test case execution completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestCaseExecutionResponse'
 *             examples:
 *               successResponse:
 *                 value:
 *                   message: "Test case execution completed"
 *                   result:
 *                     id: "90aa32c9-90c5-4ced-968b-5a6f6de8e163"
 *                     testCases:
 *                       - input: "5 7"
 *                         expectedOutput: "12"
 *                         order: 0
 *                         actualOutput: "12\n"
 *                         stderr: ""
 *                         compilationOutput: ""
 *                         executionTime: 25
 *                         exitCode: 0
 *                         passed: true
 *                         success: true
 *                       - input: "10 -5"
 *                         expectedOutput: "5"
 *                         order: 1
 *                         actualOutput: "5\n"
 *                         stderr: ""
 *                         compilationOutput: ""
 *                         executionTime: 24
 *                         exitCode: 0
 *                         passed: true
 *                         success: true
 *                       - input: "0 0"
 *                         expectedOutput: "0"
 *                         order: 2
 *                         actualOutput: "0\n"
 *                         stderr: ""
 *                         compilationOutput: ""
 *                         executionTime: 27
 *                         exitCode: 0
 *                         passed: true
 *                         success: true
 *                     summary:
 *                       totalTests: 3
 *                       passedTests: 3
 *                       failedTests: 0
 *                       successRate: 100
 *                       totalExecutionTime: 76
 *                       avgExecutionTime: 25.33
 *                       allPassed: true
 *               failedTestsResponse:
 *                 value:
 *                   message: "Test case execution completed"
 *                   result:
 *                     id: "90aa32c9-90c5-4ced-968b-5a6f6de8e163"
 *                     testCases:
 *                       - input: "5 7"
 *                         expectedOutput: "12"
 *                         order: 0
 *                         actualOutput: "13\n"
 *                         stderr: ""
 *                         compilationOutput: ""
 *                         executionTime: 25
 *                         exitCode: 0
 *                         passed: false
 *                         success: false
 *                       - input: "10 -5"
 *                         expectedOutput: "5"
 *                         order: 1
 *                         actualOutput: "5\n"
 *                         stderr: ""
 *                         compilationOutput: ""
 *                         executionTime: 24
 *                         exitCode: 0
 *                         passed: true
 *                         success: true
 *                     summary:
 *                       totalTests: 2
 *                       passedTests: 1
 *                       failedTests: 1
 *                       successRate: 50
 *                       totalExecutionTime: 49
 *                       avgExecutionTime: 24.5
 *                       allPassed: false
 *       400:
 *         description: Bad request, invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Language not found or not supported
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/run-tests", verifyToken, codeRunnerController.runTestCases);

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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/executions", verifyToken, codeRunnerController.getUserExecutions);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 execution:
 *                   $ref: '#/components/schemas/CodeExecution'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/executions/:id", verifyToken, codeRunnerController.getExecutionById);

/**
 * @swagger
 * /code/executions/{id}/test-results:
 *   get:
 *     summary: Get test case results for a code execution
 *     description: Retrieve all test case results for a specific code execution
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
 *         description: ID of the code execution
 *     responses:
 *       200:
 *         description: Test case results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TestCase'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/executions/:id/test-results", verifyToken, codeRunnerController.getTestCaseResults);

/**
 * @swagger
 * /code/executions/{id}/persistence:
 *   put:
 *     summary: Update the persistence flag for a code execution
 *     description: Mark a code execution as persistent to prevent it from being automatically cleaned up
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
 *         description: ID of the code execution
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdatePersistenceFlag'
 *     responses:
 *       200:
 *         description: Persistence flag updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Persistence flag updated successfully"
 *                 execution:
 *                   $ref: '#/components/schemas/CodeExecution'
 *       400:
 *         description: Bad request, invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put("/executions/:id/persistence", verifyToken, codeRunnerController.updatePersistence);

/**
 * @swagger
 * /code/cleanup:
 *   post:
 *     summary: Manually trigger cleanup of old code executions
 *     description: Delete old code executions and their associated test cases based on age
 *     tags: [Code Execution]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/CleanupRequestBody'
 *     responses:
 *       200:
 *         description: Cleanup operation completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CleanupResponse'
 *       400:
 *         description: Bad request, invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden, requires admin privileges
 */
router.post("/cleanup", verifyToken, isAdmin, cleanupController.manualCleanup);

/**
 * @swagger
 * /code/cleanup/config:
 *   get:
 *     summary: Get cleanup configuration and status
 *     description: Retrieve current configuration for the automatic cleanup process
 *     tags: [Code Execution]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 config:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     cleanupIntervalHours:
 *                       type: integer
 *                     retentionDays:
 *                       type: integer
 *                     lastCleanup:
 *                       type: string
 *                       format: date-time
 *                     nextScheduledCleanup:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden, requires admin privileges
 */
router.get("/cleanup/config", verifyToken, isAdmin, cleanupController.getCleanupConfig);

module.exports = router;
