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
 *             # Single file examples - basic cases
 *             nodeJS:
 *               summary: Node.js simple example
 *               value:
 *                 languageId: "ea48223f-c0cb-4aa6-b35d-1e4eb2ab16b9"
 *                 code: "console.log('Hello, World!');"
 *                 stdin: ""
 *                 isBase64Encoded: false
 *             python:
 *               summary: Python simple example
 *               value:
 *                 languageId: "bbdef3b0-a774-4382-9a9e-b263b8a46701"
 *                 code: "print('Hello, Python!')"
 *                 stdin: ""
 *                 isBase64Encoded: false
 *
 *             # Single file with input examples
 *             nodeJSWithInput:
 *               summary: Node.js with input
 *               value:
 *                 languageId: "ea48223f-c0cb-4aa6-b35d-1e4eb2ab16b9"
 *                 code: "process.stdin.on('data', (data) => {\n  const name = data.toString().trim();\n  console.log(`Hello, ${name}!`);\n  process.exit(0);\n});"
 *                 stdin: "John"
 *                 isBase64Encoded: false
 *             pythonWithInput:
 *               summary: Python with input
 *               value:
 *                 languageId: "bbdef3b0-a774-4382-9a9e-b263b8a46701"
 *                 code: "name = input()\nprint(f'Hello, {name}!')"
 *                 stdin: "Alice"
 *                 isBase64Encoded: false
 *             javaWithInput:
 *               summary: Java with input
 *               value:
 *                 languageId: "c46f6a68-200d-421a-8c80-bbcb0f1805d9"
 *                 code: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    System.out.println(\"Enter a number:\");\n    int number = scanner.nextInt();\n    System.out.println(\"You entered: \" + number);\n    System.out.println(\"Number squared: \" + (number * number));\n  }\n}"
 *                 stdin: "7"
 *                 isBase64Encoded: false
 *             cWithInput:
 *               summary: C with input
 *               value:
 *                 languageId: "276d1097-9b40-4f18-bd72-271c4e2d4eb5"
 *                 code: "#include <stdio.h>\n\nint main() {\n  int a, b;\n  scanf(\"%d %d\", &a, &b);\n  printf(\"Sum: %d\\n\", a + b);\n  return 0;\n}"
 *                 stdin: "10 15"
 *                 isBase64Encoded: false
 *             cppWithInput:
 *               summary: C++ with input
 *               value:
 *                 languageId: "7ab6c857-0022-4385-b7d0-de62434d234f"
 *                 code: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  cin >> a >> b;\n  cout << \"Product: \" << a * b << endl;\n  return 0;\n}"
 *                 stdin: "6 7"
 *                 isBase64Encoded: false
 *
 *             # Multi-file examples
 *             multiFileNodeJS:
 *               summary: Multi-file Node.js
 *               value:
 *                 languageId: "ea48223f-c0cb-4aa6-b35d-1e4eb2ab16b9"
 *                 files:
 *                   - name: "main.js"
 *                     content: "const utils = require('./utils.js');\nconst calculator = require('./calculator.js');\n\nconsole.log(utils.formatNumber(calculator.add(5, 10)));\nconsole.log(utils.formatNumber(calculator.subtract(20, 8)));"
 *                     isMain: true
 *                   - name: "utils.js"
 *                     content: "module.exports = {\n  formatNumber: (num) => `Result: ${num}`\n};"
 *                     isMain: false
 *                   - name: "calculator.js"
 *                     content: "module.exports = {\n  add: (a, b) => a + b,\n  subtract: (a, b) => a - b\n};"
 *                     isMain: false
 *                 stdin: ""
 *                 isBase64Encoded: false
 *             multiFileJava:
 *               summary: Multi-file Java
 *               value:
 *                 languageId: "c46f6a68-200d-421a-8c80-bbcb0f1805d9"
 *                 files:
 *                   - name: "Main.java"
 *                     content: "public class Main {\n  public static void main(String[] args) {\n    Calculator calc = new Calculator();\n    Formatter fmt = new Formatter();\n    System.out.println(fmt.format(calc.add(15, 27)));\n    System.out.println(fmt.format(calc.subtract(50, 13)));\n  }\n}"
 *                     isMain: true
 *                   - name: "Calculator.java"
 *                     content: "public class Calculator {\n  public int add(int a, int b) {\n    return a + b;\n  }\n  \n  public int subtract(int a, int b) {\n    return a - b;\n  }\n}"
 *                     isMain: false
 *                   - name: "Formatter.java"
 *                     content: "public class Formatter {\n  public String format(int value) {\n    return \"Result: \" + value;\n  }\n}"
 *                     isMain: false
 *                 stdin: ""
 *                 isBase64Encoded: false
 *             multiFilePython:
 *               summary: Multi-file Python
 *               value:
 *                 languageId: "bbdef3b0-a774-4382-9a9e-b263b8a46701"
 *                 files:
 *                   - name: "main.py"
 *                     content: "import utils\nfrom calculator import Calculator\n\ncalc = Calculator()\nprint(utils.format_result(calc.add(8, 12)))\nprint(utils.format_result(calc.multiply(4, 5)))"
 *                     isMain: true
 *                   - name: "utils.py"
 *                     content: "def format_result(value):\n    return f\"The result is: {value}\""
 *                     isMain: false
 *                   - name: "calculator.py"
 *                     content: "class Calculator:\n    def add(self, a, b):\n        return a + b\n        \n    def multiply(self, a, b):\n        return a * b"
 *                     isMain: false
 *                 stdin: ""
 *                 isBase64Encoded: false
 *
 *             # Multi-file with input examples
 *             multiFileJavaWithInput:
 *               summary: Multi-file Java with input
 *               value:
 *                 languageId: "c46f6a68-200d-421a-8c80-bbcb0f1805d9"
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
 *             multiFilePythonWithInput:
 *               summary: Multi-file Python with input
 *               value:
 *                 languageId: "bbdef3b0-a774-4382-9a9e-b263b8a46701"
 *                 files:
 *                   - name: "main.py"
 *                     content: "import utils\nfrom calculator import Calculator\n\na, b = map(int, input().split())\ncalc = Calculator()\nprint(utils.format_result('Addition', calc.add(a, b)))\nprint(utils.format_result('Product', calc.multiply(a, b)))"
 *                     isMain: true
 *                   - name: "utils.py"
 *                     content: "def format_result(operation, value):\n    return f\"{operation}: {value}\""
 *                     isMain: false
 *                   - name: "calculator.py"
 *                     content: "class Calculator:\n    def add(self, a, b):\n        return a + b\n        \n    def multiply(self, a, b):\n        return a * b"
 *                     isMain: false
 *                 stdin: "8 4"
 *                 isBase64Encoded: false
 *
 *             # Encoded content examples
 *             singleFileBase64:
 *               summary: Single file with base64 encoding (Node.js)
 *               value:
 *                 languageId: "ea48223f-c0cb-4aa6-b35d-1e4eb2ab16b9"
 *                 code: "Y29uc29sZS5sb2coIlRoaXMgaXMgYmFzZTY0IGVuY29kZWQgY29kZSIpOw=="
 *                 stdin: ""
 *                 isBase64Encoded: true
 *             multiFilesBase64:
 *               summary: Multi-file with base64 encoding (Node.js)
 *               value:
 *                 languageId: "ea48223f-c0cb-4aa6-b35d-1e4eb2ab16b9"
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
 *               successNodeJS:
 *                 value:
 *                   message: "Code execution completed"
 *                   result:
 *                     id: "ea48223f-c0cb-4aa6-b35d-1e4eb2ab16b9"
 *                     stdout: "Hello, World!\n"
 *                     stderr: ""
 *                     compilationOutput: ""
 *                     executionTime: 25
 *                     memoryUsage: 8192
 *                     exitCode: 0
 *                     success: true
 *               successPython:
 *                 value:
 *                   message: "Code execution completed"
 *                   result:
 *                     id: "bbdef3b0-a774-4382-9a9e-b263b8a46701"
 *                     stdout: "Hello, Python!\n"
 *                     stderr: ""
 *                     compilationOutput: ""
 *                     executionTime: 18
 *                     memoryUsage: 7168
 *                     exitCode: 0
 *                     success: true
 *               successJavaWithInput:
 *                 value:
 *                   message: "Code execution completed"
 *                   result:
 *                     id: "c46f6a68-200d-421a-8c80-bbcb0f1805d9"
 *                     stdout: "Enter a number:\nYou entered: 7\nNumber squared: 49\n"
 *                     stderr: ""
 *                     compilationOutput: ""
 *                     executionTime: 157
 *                     memoryUsage: 25600
 *                     exitCode: 0
 *                     success: true
 *               compilationError:
 *                 value:
 *                   message: "Code execution completed with compilation errors"
 *                   result:
 *                     id: "c46f6a68-200d-421a-8c80-bbcb0f1805d9"
 *                     stdout: ""
 *                     stderr: ""
 *                     compilationOutput: "Main.java:5: error: ';' expected\n    System.out.println(\"Missing semicolon\")\n                                       ^\n1 error\n"
 *                     executionTime: 0
 *                     memoryUsage: 0
 *                     exitCode: 1
 *                     success: false
 *               runtimeError:
 *                 value:
 *                   message: "Code execution completed with runtime errors"
 *                   result:
 *                     id: "ea48223f-c0cb-4aa6-b35d-1e4eb2ab16b9"
 *                     stdout: ""
 *                     stderr: "ReferenceError: undefinedVariable is not defined\n    at Object.<anonymous> (/tmp/execution/code.js:1:13)\n    at Module._compile (internal/modules/cjs/loader.js:1085:14)\n"
 *                     compilationOutput: ""
 *                     executionTime: 12
 *                     memoryUsage: 8192
 *                     exitCode: 1
 *                     success: false
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
 *       content:
 *         application/json:
 *           examples:
 *             # Basic test cases by language
 *             nodeJSExample:
 *               summary: Node.js basic test cases
 *               value:
 *                 languageId: "ea48223f-c0cb-4aa6-b35d-1e4eb2ab16b9"
 *                 code: "process.stdin.on('data', (chunk) => {\n  const input = chunk.toString().trim().split(' ');\n  const a = parseInt(input[0]);\n  const b = parseInt(input[1]);\n  console.log(a + b);\n  process.exit(0);\n});"
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
 *               summary: Python basic test cases
 *               value:
 *                 languageId: "bbdef3b0-a774-4382-9a9e-b263b8a46701"
 *                 code: "a, b = map(int, input().split())\nprint(a + b)"
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
 *             javaExample:
 *               summary: Java basic test cases
 *               value:
 *                 languageId: "c46f6a68-200d-421a-8c80-bbcb0f1805d9"
 *                 code: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int a = scanner.nextInt();\n    int b = scanner.nextInt();\n    System.out.println(a + b);\n  }\n}"
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
 *             cExample:
 *               summary: C basic test cases
 *               value:
 *                 languageId: "276d1097-9b40-4f18-bd72-271c4e2d4eb5"
 *                 code: "#include <stdio.h>\n\nint main() {\n  int a, b;\n  scanf(\"%d %d\", &a, &b);\n  printf(\"%d\", a + b);\n  return 0;\n}"
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
 *             cppExample:
 *               summary: C++ basic test cases
 *               value:
 *                 languageId: "7ab6c857-0022-4385-b7d0-de62434d234f"
 *                 code: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  cin >> a >> b;\n  cout << a + b;\n  return 0;\n}"
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
 *
 *             # Complex test cases
 *             stringManipulation:
 *               summary: String manipulation test cases (Python)
 *               value:
 *                 languageId: "bbdef3b0-a774-4382-9a9e-b263b8a46701"
 *                 code: "s = input().strip()\nif s == s[::-1]:\n    print('PALINDROME')\nelse:\n    print('NOT PALINDROME')"
 *                 testCases:
 *                   - input: "racecar"
 *                     expectedOutput: "PALINDROME"
 *                     order: 0
 *                   - input: "hello"
 *                     expectedOutput: "NOT PALINDROME"
 *                     order: 1
 *                   - input: "madam"
 *                     expectedOutput: "PALINDROME"
 *                     order: 2
 *                   - input: "level"
 *                     expectedOutput: "PALINDROME"
 *                     order: 3
 *                 isBase64Encoded: false
 *             errorHandling:
 *               summary: Error handling test cases (Node.js)
 *               value:
 *                 languageId: "ea48223f-c0cb-4aa6-b35d-1e4eb2ab16b9"
 *                 code: "process.stdin.on('data', (chunk) => {\n  try {\n    const input = chunk.toString().trim();\n    const num = parseInt(input);\n    if (isNaN(num)) throw new Error('Not a number');\n    console.log(`Valid number: ${num}`);\n  } catch (err) {\n    console.log(`Error: ${err.message}`);\n  }\n  process.exit(0);\n});"
 *                 testCases:
 *                   - input: "42"
 *                     expectedOutput: "Valid number: 42"
 *                     order: 0
 *                   - input: "abc"
 *                     expectedOutput: "Error: Not a number"
 *                     order: 1
 *                   - input: "0"
 *                     expectedOutput: "Valid number: 0"
 *                     order: 2
 *                 isBase64Encoded: false
 *
 *             # Test with complex input/output
 *             multilineIO:
 *               summary: Test cases with multiline input/output (Python)
 *               value:
 *                 languageId: "bbdef3b0-a774-4382-9a9e-b263b8a46701"
 *                 code: "n = int(input())\nfor i in range(1, n+1):\n    print('*' * i)"
 *                 testCases:
 *                   - input: "3"
 *                     expectedOutput: "*\n**\n***"
 *                     order: 0
 *                   - input: "5"
 *                     expectedOutput: "*\n**\n***\n****\n*****"
 *                     order: 1
 *                 isBase64Encoded: false
 *
 *             # Base64 encoded example
 *             base64EncodedTest:
 *               summary: Test cases with base64 encoding (Node.js)
 *               value:
 *                 languageId: "ea48223f-c0cb-4aa6-b35d-1e4eb2ab16b9"
 *                 code: "cHJvY2Vzcy5zdGRpbi5vbignZGF0YScsIChjaHVuaykgPT4gewogIGNvbnN0IGlucHV0ID0gY2h1bmsudG9TdHJpbmcoKS50cmltKCkuc3BsaXQoJyAnKTsKICBjb25zdCBhID0gcGFyc2VJbnQoaW5wdXRbMF0pOwogIGNvbnN0IGIgPSBwYXJzZUludChpbnB1dFsxXSk7CiAgY29uc29sZS5sb2coYSArIGIpOwogIHByb2Nlc3MuZXhpdCgwKTsKfSk7"
 *                 testCases:
 *                   - input: "NSA3"
 *                     expectedOutput: "MTI="
 *                     order: 0
 *                   - input: "MTAgLTU="
 *                     expectedOutput: "NQ=="
 *                     order: 1
 *                 isBase64Encoded: true
 *
 *             # Failed test cases example
 *             partiallyCorrectCode:
 *               summary: Test with partially correct code (Python)
 *               value:
 *                 languageId: "bbdef3b0-a774-4382-9a9e-b263b8a46701"
 *                 code: "a, b = map(int, input().split())\nif a > b:\n    print(a - b)  # Should be a + b for all cases\nelse:\n    print(a + b)"
 *                 testCases:
 *                   - input: "5 7"
 *                     expectedOutput: "12"
 *                     order: 0
 *                   - input: "10 5"
 *                     expectedOutput: "15"  # Will fail since code calculates 10-5=5
 *                     order: 1
 *                   - input: "8 8"
 *                     expectedOutput: "16"
 *                     order: 2
 *                 isBase64Encoded: false
 *     responses:
 *       200:
 *         description: Test case execution completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestCaseExecutionResponse'
 *             examples:
 *               successAllTestsPass:
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
 *               partiallyPassedTests:
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
 *                       - input: "10 5"
 *                         expectedOutput: "15"
 *                         order: 1
 *                         actualOutput: "5\n"
 *                         stderr: ""
 *                         compilationOutput: ""
 *                         executionTime: 24
 *                         exitCode: 0
 *                         passed: false
 *                         success: false
 *                       - input: "8 8"
 *                         expectedOutput: "16"
 *                         order: 2
 *                         actualOutput: "16\n"
 *                         stderr: ""
 *                         compilationOutput: ""
 *                         executionTime: 27
 *                         exitCode: 0
 *                         passed: true
 *                         success: true
 *                     summary:
 *                       totalTests: 3
 *                       passedTests: 2
 *                       failedTests: 1
 *                       successRate: 66.67
 *                       totalExecutionTime: 76
 *                       avgExecutionTime: 25.33
 *                       allPassed: false
 *               compilationError:
 *                 value:
 *                   message: "Test case execution completed with compilation errors"
 *                   result:
 *                     id: "4fa69a1a-5b1f-4e1d-a3ba-a8afec213a0b"
 *                     testCases:
 *                       - input: "5 7"
 *                         expectedOutput: "12"
 *                         order: 0
 *                         actualOutput: ""
 *                         stderr: ""
 *                         compilationOutput: "Main.java:6: error: ';' expected\n    System.out.println(a + b)\n                          ^\n1 error\n"
 *                         executionTime: 0
 *                         exitCode: 1
 *                         passed: false
 *                         success: false
 *                     summary:
 *                       totalTests: 1
 *                       passedTests: 0
 *                       failedTests: 1
 *                       successRate: 0
 *                       totalExecutionTime: 0
 *                       avgExecutionTime: 0
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
router.get(
  "/executions/:id",
  verifyToken,
  codeRunnerController.getExecutionById
);

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
router.get(
  "/executions/:id/test-results",
  verifyToken,
  codeRunnerController.getTestCaseResults
);

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
router.put(
  "/executions/:id/persistence",
  verifyToken,
  codeRunnerController.updatePersistence
);

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
router.get(
  "/cleanup/config",
  verifyToken,
  isAdmin,
  cleanupController.getCleanupConfig
);

module.exports = router;
