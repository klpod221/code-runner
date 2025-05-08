<div align="center">
    <h1>--// Code Runner API //--</h1>
    <img src="https://img.shields.io/github/last-commit/klpod221/code-runner?style=for-the-badge&color=ffb4a2&labelColor=201a19">
    <img src="https://img.shields.io/github/stars/klpod221/code-runner?style=for-the-badge&color=e6c419&labelColor=1d1b16">
    <img src="https://img.shields.io/github/repo-size/klpod221/code-runner?style=for-the-badge&color=a8c7ff&labelColor=1a1b1f">
</div>

## Overview

Code Runner API provides a platform for executing code in different programming languages through a RESTful API. It's designed with security, scalability, and performance in mind, making it suitable for educational platforms, coding challenges, and automated assessment systems.

The architecture consists of two separate services:
1. **API Service**: Handles user authentication, request validation, and database operations
2. **Code Runner Service**: Executes code in isolated environments for enhanced security

## Features

- **Multi-language Support**: Run code in multiple programming languages including JavaScript, Python, Java, C, C++, and more
- **Secure Execution**: Code runs in isolated environments with a non-root user to prevent system compromise
- **Test Case Support**: Execute code against predefined test cases and validate outputs
- **API Documentation**: Comprehensive Swagger documentation
- **Authentication**: JWT-based authentication system
- **Rate Limiting**: Configurable request rate limiting to prevent abuse
- **Database Integration**: PostgreSQL database for storing user data, execution results, and settings
- **Customizable Settings**: Dynamic settings management via API
- **Service Architecture**: Separated API and code execution services for enhanced security and scalability

## Architecture

The system is split into two services:

1. **API Service** (port 3000)
   - User-facing REST API
   - User authentication and authorization
   - Request validation
   - Database access
   - API documentation

2. **Code Runner Service** (port 3001)
   - Isolated code execution environment
   - Runs as non-root user for security
   - Supports multiple programming languages
   - Handles compilation and execution
   - Test case evaluation

These services communicate over HTTP, providing enhanced security and scalability.

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Sequelize ORM
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan, Winston

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- PostgreSQL (or use the provided Docker container)

## Getting Started

### Using Docker (Recommended)

This method is recommended for running the application in a secure environment.

1. Clone the repository:
   ```bash
   git clone https://github.com/klpod221/code-runner.git
   cd code-runner
   ```

2. Create a `.env` file in the project root (see `.env.example` for required values)

3. Start the application:
   ```bash
   docker-compose up -d
   ```

4. Access the API at http://localhost:3000 and the API documentation at http://localhost:3000/docs

### Local Development

**I not recommend this method, because it is not secure. I will not be responsible for any damage to your machine or data loss.**
This method is not secure, because it runs the code on your local machine. It is not recommended to run untrusted code on your local machine. Use Docker for a secure environment.

1. Clone the repository:
   ```bash
   git clone https://github.com/klpod221/code-runner.git
   cd code-runner
   ```

2. Install dependencies for both services:
   ```bash
   cd api && npm install
   cd ../code_runner && npm install
   ```

3. Set up your PostgreSQL database

4. Install all dependencies for code execution like jdk, node, python, gcc, g++, etc. on your local machine.

   For example, on Ubuntu:
   ```bash
   sudo apt-get install openjdk-17-jdk nodejs npm python3 gcc g++
   ```

   For MacOS, you can use Homebrew:
   ```bash
   brew install openjdk@17 node python3 gcc
   ```

5. Create a `.env` file with your configuration values (see `.env.example` for required values)

6. Run database migrations:
   ```bash
   cd api
   npm run migrate
   npm run seed
   ```

7. Start both development servers:
   ```bash
   # In terminal 1
   cd api && npm run dev
   
   # In terminal 2
   cd code_runner && npm run dev
   ```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /api/auth/register | Register a new user |
| POST   | /api/auth/login | Authenticate a user |
| GET    | /api/auth/profile | Get authenticated user's profile |

### Code Execution
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /api/code/run | Execute code in selected language |
| POST   | /api/code/run-tests | Execute code with test cases |
| GET    | /api/code/executions | Get user's code execution history |
| GET    | /api/code/executions/:id | Get specific code execution details |
| GET    | /api/code/executions/:id/test-results | Get test case results for a code execution |
| PUT    | /api/code/executions/:id/persistence | Update persistence flag for a code execution |
| POST   | /api/code/cleanup | Trigger cleanup of old executions (admin only) |
| GET    | /api/code/cleanup/config | Get cleanup configuration (admin only) |

### Languages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/languages | List all supported languages |
| GET    | /api/languages/:id | Get specific language details |

### System Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/health | Basic API health check |
| GET    | /api/health/db | Database connection health check |
| GET    | /api/health/languages | Programming language support health check |
| GET    | /api/health/full | Complete system health report |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/settings | Get all application settings (admin only) |
| GET    | /api/settings/categories | Get settings organized by category (admin only) |
| PUT    | /api/settings | Update an application setting (admin only) |

For detailed API documentation, visit the Swagger UI at `/docs` when the server is running.

## Available Scripts

### API Service
- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm test` - Run tests
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed the database with initial data
- `npm run lint` - Run ESLint

### Code Runner Service
- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm test` - Run tests

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
NODE_ENV=development
DOMAIN=http://localhost
PORT=3000

# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=code_runner

# Authentication (let JWT_EXPIRATION empty for no expiration)
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRATION=24h

# Code Runner Service
CODE_RUNNER_URL=http://code_runner:3001

# Code Execution Settings
MAX_EXECUTION_TIME=10000
MAX_MEMORY=512

# Language Versions
# These are used for health checks and version reporting
NODEJS_VERSION=20
PYTHON_VERSION=3
JAVA_VERSION=17
CPP_VERSION=11
C_VERSION=11
```

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.