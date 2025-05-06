# Code Runner API

A containerized API for executing code in multiple programming languages (Node.js, Python, C, C++, Java) using Docker.

## Project Structure

This project consists of three main Docker containers:

1. **API Container**: Handles API requests, user authentication, and communication with the code runner
2. **Database Container**: PostgreSQL database to store users, code execution history, and supported languages
3. **Code Runner Container**: Responsible for safely executing code in various programming languages

## Features

- Run code in multiple programming languages (Node.js, Python, C, C++, Java)
- Support for multi-file code execution
- Secure execution environment
- User authentication
- Code execution history tracking
- Base64 encoding option for code content to ensure integrity

## Setup

### Prerequisites

- Docker
- Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd code-runner
```

2. Build and run the containers:
```bash
docker-compose up -d
```

3. The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login existing user
- `GET /api/auth/profile` - Get current user profile (requires authentication)

### Languages

- `GET /api/languages` - Get all supported programming languages
- `GET /api/languages/:id` - Get specific language by ID

### Code Execution

- `POST /api/code/run` - Execute code (requires authentication)
- `GET /api/code/history` - Get user's code execution history (requires authentication)
- `GET /api/code/execution/:id` - Get specific execution details (requires authentication)

## Usage Examples

### Running Code

To execute code, send a POST request to `/api/code/run` with the following payload:

```json
{
  "languageId": "uuid-of-language",
  "code": "console.log('Hello, World!');",
  "stdin": "optional input data"
}
```

For multi-file execution:

```json
{
  "languageId": "uuid-of-language",
  "files": [
    {
      "name": "main.js",
      "content": "const helper = require('./helper'); console.log(helper.getMessage());",
      "isMain": true
    },
    {
      "name": "helper.js",
      "content": "exports.getMessage = () => 'Hello, World!';"
    }
  ],
  "stdin": "optional input data"
}
```

### Response Format

```json
{
  "message": "Code execution completed",
  "result": {
    "id": "execution-uuid",
    "stdout": "Hello, World!",
    "stderr": "",
    "compilationOutput": "",
    "executionTime": 42,
    "memoryUsage": 1024,
    "exitCode": 0,
    "success": true
  }
}
```

## Security Considerations

- Code execution is sandboxed in Docker containers
- Resource limits for CPU, memory, and execution time
- User authentication required for code execution
- Rate limiting to prevent abuse

## License

MIT License