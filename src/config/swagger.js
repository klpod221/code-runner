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
          },
        },
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
