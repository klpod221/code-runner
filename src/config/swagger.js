const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Code Runner API",
      version: "1.0.0",
      description: "API for executing code in multiple programming languages",
      contact: {
        name: "API Support",
        url: "https://klpod221.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication endpoints",
      },
      {
        name: "Languages",
        description: "Programming language information endpoints",
      },
      {
        name: "Code Execution",
        description: "Endpoints for running code and viewing execution history",
      },
      {
        name: "Health",
        description: "System health and status endpoints",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // User schema
        User: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "The auto-generated UUID of the user",
            },
            username: {
              type: "string",
              description: "The username of the user",
            },
            email: {
              type: "string",
              format: "email",
              description: "The email of the user",
            },
            password: {
              type: "string",
              format: "password",
              description: "The password of the user",
              writeOnly: true,
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              description: "The role of the user",
            },
            isActive: {
              type: "boolean",
              description: "Whether the user is active",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The date the user was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "The date the user was last updated",
            },
          },
          example: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            username: "johndoe",
            email: "john@example.com",
            role: "user",
            isActive: true,
            createdAt: "2023-01-01T12:00:00Z",
            updatedAt: "2023-01-01T12:00:00Z",
          },
        },
        // Language schema
        Language: {
          type: "object",
          required: [
            "name",
            "displayName",
            "extension",
            "version",
            "runCommand",
          ],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "The auto-generated UUID of the language",
            },
            name: {
              type: "string",
              description: "The unique name of the language",
            },
            displayName: {
              type: "string",
              description: "The human-readable name of the language",
            },
            extension: {
              type: "string",
              description: "The file extension for this language",
            },
            version: {
              type: "string",
              description: "The version of the language implementation",
            },
            compileCommand: {
              type: "string",
              description:
                "The command to compile code in this language (for compiled languages)",
            },
            runCommand: {
              type: "string",
              description: "The command to run code in this language",
            },
            isCompiled: {
              type: "boolean",
              description: "Whether the language requires compilation",
            },
            isActive: {
              type: "boolean",
              description: "Whether this language is currently available",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The date the language was added",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "The date the language was last updated",
            },
          },
          example: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "nodejs",
            displayName: "Node.js",
            extension: ".js",
            version: "18.x",
            runCommand: "node",
            isCompiled: false,
            isActive: true,
            createdAt: "2023-01-01T12:00:00Z",
            updatedAt: "2023-01-01T12:00:00Z",
          },
        },
        // CodeExecution schema
        CodeExecution: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "The auto-generated UUID of the execution",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "The UUID of the user who ran the code",
            },
            languageId: {
              type: "string",
              format: "uuid",
              description: "The UUID of the language used",
            },
            code: {
              type: "string",
              description: "The code that was executed",
            },
            stdin: {
              type: "string",
              description: "The standard input provided to the program",
            },
            stdout: {
              type: "string",
              description: "The standard output from the program",
            },
            stderr: {
              type: "string",
              description: "The standard error from the program",
            },
            compilationOutput: {
              type: "string",
              description:
                "Output from the compilation step (for compiled languages)",
            },
            executionTime: {
              type: "integer",
              description: "The time taken for execution in milliseconds",
            },
            memoryUsage: {
              type: "integer",
              description: "The memory used in kilobytes",
            },
            exitCode: {
              type: "integer",
              description: "The exit code of the program",
            },
            status: {
              type: "string",
              enum: ["pending", "running", "completed", "failed"],
              description: "The status of the execution",
            },
            error: {
              type: "string",
              description: "Any error message from the execution",
            },
            isPersistent: {
              type: "boolean",
              description: "Whether this execution is protected from cleanup",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The date the execution was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "The date the execution was last updated",
            },
            language: {
              $ref: "#/components/schemas/Language",
              description: "The language used for this execution",
            },
            user: {
              $ref: "#/components/schemas/User",
              description: "The user who created this execution",
            },
            testCases: {
              type: "array",
              items: {
                $ref: "#/components/schemas/TestCase",
              },
              description: "Test cases associated with this execution",
            },
          },
          example: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            userId: "550e8400-e29b-41d4-a716-446655440000",
            languageId: "550e8400-e29b-41d4-a716-446655440000",
            code: "console.log('Hello, World!');",
            stdin: "",
            stdout: "Hello, World!\n",
            stderr: "",
            compilationOutput: "",
            executionTime: 42,
            memoryUsage: 1024,
            exitCode: 0,
            status: "completed",
            error: "",
            isPersistent: false,
            createdAt: "2023-01-01T12:00:00Z",
            updatedAt: "2023-01-01T12:00:00Z",
          },
        },
        // TestCase schema
        TestCase: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "The auto-generated UUID of the test case",
            },
            codeExecutionId: {
              type: "string", 
              format: "uuid",
              description: "The UUID of the related code execution",
            },
            input: {
              type: "string",
              description: "The input provided to the test case",
            },
            expectedOutput: {
              type: "string",
              description: "The expected output of the test case",
            },
            actualOutput: {
              type: "string",
              description: "The actual output produced by the code",
            },
            passed: {
              type: "boolean",
              description: "Whether the test case passed or failed",
            },
            executionTime: {
              type: "integer",
              description: "The time taken to execute the test case in milliseconds",
            },
            order: {
              type: "integer",
              description: "The order in which the test case was run",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The date the test case was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "The date the test case was last updated",
            },
          },
          example: {
            id: "550e8400-e29b-41d4-a716-446655440001",
            codeExecutionId: "550e8400-e29b-41d4-a716-446655440000",
            input: "5 7",
            expectedOutput: "12",
            actualOutput: "12\n",
            passed: true,
            executionTime: 25,
            order: 0,
            createdAt: "2023-01-01T12:00:00Z",
            updatedAt: "2023-01-01T12:00:00Z",
          },
        },
        // Health schemas
        HealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "healthy"
            },
            timestamp: {
              type: "string",
              example: "2023-05-15T14:30:25.000Z"
            },
            uptime: {
              type: "string",
              example: "1234.56 seconds"
            },
            serverInfo: {
              type: "object"
            },
            env: {
              type: "string",
              example: "development"
            }
          }
        },
        DatabaseHealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "healthy"
            },
            message: {
              type: "string",
              example: "Database connection is working"
            },
            timestamp: {
              type: "string",
              example: "2023-05-15T14:30:25.000Z"
            },
            dbInfo: {
              type: "object",
              properties: {
                name: {
                  type: "string"
                },
                host: {
                  type: "string"
                },
                port: {
                  type: "number"
                },
                dialect: {
                  type: "string"
                }
              }
            }
          }
        },
        FullHealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "healthy"
            },
            api: {
              $ref: '#/components/schemas/HealthResponse'
            },
            database: {
              $ref: '#/components/schemas/DatabaseHealthResponse'
            },
            components: {
              type: "object"
            }
          }
        },
        // Language response schemas
        LanguageListResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Languages retrieved successfully"
            },
            languages: {
              type: "array",
              items: {
                $ref: '#/components/schemas/Language'
              }
            }
          }
        },
        LanguageDetailResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Language retrieved successfully"
            },
            language: {
              $ref: '#/components/schemas/Language'
            }
          }
        },
        // Auth response schemas
        AuthResponse: {
          type: "object",
          properties: {
            message: {
              type: "string"
            },
            token: {
              type: "string",
              description: "JWT token for authenticating requests"
            },
            user: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid"
                },
                username: {
                  type: "string"
                },
                email: {
                  type: "string",
                  format: "email"
                },
                role: {
                  type: "string",
                  enum: ["user", "admin"]
                }
              }
            }
          }
        },
        ProfileResponse: {
          type: "object",
          properties: {
            message: {
              type: "string"
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        // Code execution response schemas
        CodeExecutionResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Code execution completed"
            },
            result: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid"
                },
                stdout: {
                  type: "string"
                },
                stderr: {
                  type: "string"
                },
                compilationOutput: {
                  type: "string"
                },
                executionTime: {
                  type: "integer"
                },
                memoryUsage: {
                  type: "integer"
                },
                exitCode: {
                  type: "integer"
                },
                success: {
                  type: "boolean"
                }
              }
            }
          }
        },
        TestCaseResult: {
          type: "object",
          properties: {
            input: {
              type: "string"
            },
            expectedOutput: {
              type: "string"
            },
            actualOutput: {
              type: "string"
            },
            passed: {
              type: "boolean"
            },
            executionTime: {
              type: "integer"
            },
            stderr: {
              type: "string"
            },
            exitCode: {
              type: "integer"
            },
            order: {
              type: "integer"
            }
          }
        },
        TestSummary: {
          type: "object",
          properties: {
            totalTests: {
              type: "integer"
            },
            passedTests: {
              type: "integer"
            },
            failedTests: {
              type: "integer"
            },
            successRate: {
              type: "number"
            },
            totalExecutionTime: {
              type: "integer"
            },
            avgExecutionTime: {
              type: "number"
            },
            allPassed: {
              type: "boolean"
            }
          }
        },
        TestCaseExecutionResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Test case execution completed"
            },
            result: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid"
                },
                testCases: {
                  type: "array",
                  items: {
                    $ref: '#/components/schemas/TestCaseResult'
                  }
                },
                summary: {
                  $ref: '#/components/schemas/TestSummary'
                }
              }
            }
          }
        },
        CleanupResponse: {
          type: "object",
          properties: {
            message: {
              type: "string"
            },
            result: {
              type: "object",
              properties: {
                cutoffDate: {
                  type: "string",
                  format: "date-time"
                },
                identifiedExecutions: {
                  type: "integer"
                },
                identifiedTestCases: {
                  type: "integer"
                },
                deletedExecutions: {
                  type: "integer"
                },
                deletedTestCases: {
                  type: "integer"
                },
                dryRun: {
                  type: "boolean"
                }
              }
            }
          }
        }
      },
      requestBodies: {
        UserRegister: {
          description: "User registration information",
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                  username: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        UserLogin: {
          description: "User login information",
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        SingleFileCodeExecution: {
          description: "Code execution with a single file",
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["languageId", "code"],
                properties: {
                  languageId: { type: "string", format: "uuid" },
                  code: { type: "string" },
                  stdin: { type: "string" },
                },
              },
            },
          },
        },
        MultiFileCodeExecution: {
          description: "Code execution with multiple files",
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["languageId", "files"],
                properties: {
                  languageId: { type: "string", format: "uuid" },
                  files: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["name", "content"],
                      properties: {
                        name: { type: "string" },
                        content: { type: "string" },
                        isMain: { type: "boolean" },
                      },
                    },
                  },
                  stdin: { type: "string" },
                },
              },
            },
          },
        },
        TestCaseExecution: {
          description: "Execute code against multiple test cases",
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["languageId", "testCases"],
                properties: {
                  languageId: { 
                    type: "string", 
                    format: "uuid",
                    description: "ID of the language to use"
                  },
                  code: { 
                    type: "string",
                    description: "Source code to execute (single file)" 
                  },
                  files: {
                    type: "array",
                    description: "Array of file objects for multi-file submissions",
                    items: {
                      type: "object",
                      required: ["name", "content"],
                      properties: {
                        name: { 
                          type: "string",
                          description: "File name with extension"
                        },
                        content: { 
                          type: "string",
                          description: "File content"
                        },
                        isMain: { 
                          type: "boolean",
                          description: "Whether this is the main file to execute"
                        },
                      },
                    },
                  },
                  testCases: {
                    type: "array",
                    description: "Test cases to run against the code",
                    items: {
                      type: "object",
                      required: ["expectedOutput"],
                      properties: {
                        input: {
                          type: "string",
                          description: "Input to provide to the program (stdin)"
                        },
                        expectedOutput: {
                          type: "string",
                          description: "Expected output (stdout) the program should produce"
                        },
                        order: {
                          type: "integer",
                          description: "Order in which to run the test case"
                        }
                      }
                    }
                  },
                  isBase64Encoded: {
                    type: "boolean",
                    description: "Whether the code/files and input/output are base64 encoded",
                    default: false
                  },
                  isPersistent: {
                    type: "boolean",
                    description: "Whether to mark this execution as persistent (not auto-deleted)",
                    default: false
                  }
                },
              },
            },
          },
        },
        UpdatePersistenceFlag: {
          description: "Update persistence flag for a code execution",
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["isPersistent"],
                properties: {
                  isPersistent: {
                    type: "boolean",
                    description: "Whether the execution should be persistent (not auto-deleted)"
                  }
                }
              }
            }
          }
        },
        CleanupRequestBody: {
          description: "Parameters for manual cleanup operation",
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  days: {
                    type: "integer",
                    description: "Delete executions older than this many days",
                    default: 7
                  },
                  dryRun: {
                    type: "boolean",
                    description: "If true, only count records without deleting them",
                    default: false
                  },
                  ignorePersistent: {
                    type: "boolean",
                    description: "If true, also delete executions marked as persistent",
                    default: false
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: "The specified resource was not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
        ServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js", "./src/swagger/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
