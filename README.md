# Code Runner API

A RESTful API service for executing code in multiple programming languages (Node.js, Python, C, C++, Java) with security features and user management.

## Project Structure

The project follows a standard Node.js/Express application structure:

- `src/` - Source code directory
  - `controllers/` - Request handlers
  - `middleware/` - Express middleware
  - `models/` - Database models (Sequelize)
  - `routes/` - API route definitions
  - `config/` - Configuration files
  - `index.js` - Main application entry point

## Features

- Execute code in multiple programming languages (Node.js, Python, C, C++, Java)
- Support for multi-file code execution
- User authentication and authorization
- Code execution history tracking
- Base64 encoding option for code content
- API documentation with Swagger UI
- Database integration with PostgreSQL and Sequelize
- Security features: rate limiting, CORS, helmet protection

## Docker Setup

### Prerequisites

- Docker
- Docker Compose

### Running with Docker

1. Clone the repository:

```bash
git clone <repository-url>
cd code-runner
```

2. Create a `.env` file based on the `.env.example`:

```bash
cp .env.example .env
```

Fill in the required environment variables, especially for database connection.

3. Build and start the containers:

```bash
docker-compose up -d
```

4. The API will be available at `http://localhost:3000` with documentation at `http://localhost:3000/api-docs`

### Docker Management Commands

- Start containers: `docker-compose up -d`
- Stop containers: `docker-compose down`
- View logs: `docker-compose logs -f api`
- Rebuild containers: `docker-compose build`
- Run migrations: `docker-compose exec api npm run migrate`
- Seed database: `docker-compose exec api npm run seed`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login existing user
- `GET /api/auth/profile` - Get current user profile (requires authentication)

### Languages

- `GET /api/languages` - Get all supported programming languages
- `GET /api/languages/:id` - Get specific language by ID

### Code Execution

- `POST /api/code/run` - Execute code in the specified language (requires authentication)
- `GET /api/code/executions` - Get user's code execution history (requires authentication)
- `GET /api/code/executions/:id` - Get specific execution details by ID (requires authentication)

## Usage Examples

### Running Code

#### Single File Execution

To execute a single file of code, send a POST request to `/api/code/run` with the following payload:

```json
{
  "languageId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "console.log('Hello, World!');",
  "stdin": "",
  "isBase64Encoded": false
}
```

#### Multi-file Execution

For multi-file execution:

```json
{
  "languageId": "550e8400-e29b-41d4-a716-446655440000",
  "files": [
    {
      "name": "main.js",
      "content": "const utils = require('./utils.js');\nconst calculator = require('./calculator.js');\n\nconsole.log(utils.formatNumber(calculator.add(5, 10)));",
      "isMain": true
    },
    {
      "name": "utils.js",
      "content": "module.exports = {\n  formatNumber: (num) => `Result: ${num}`\n};"
    },
    {
      "name": "calculator.js",
      "content": "module.exports = {\n  add: (a, b) => a + b,\n  subtract: (a, b) => a - b\n};"
    }
  ],
  "stdin": "",
  "isBase64Encoded": false
}
```

#### With Base64 Encoding

You can also encode your content using Base64 for data integrity:

```json
{
  "languageId": "550e8400-e29b-41d4-a716-446655440000",
  "files": [
    {
      "name": "main.js",
      "content": "Y29uc3QgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7CmNvbnN0IGNhbGN1bGF0b3IgPSByZXF1aXJlKCcuL2NhbGN1bGF0b3IuanMnKTsKCmNvbnNvbGUubG9nKHV0aWxzLmZvcm1hdE51bWJlcihjYWxjdWxhdG9yLmFkZCg1LCAxMCkpKTs=",
      "isMain": true
    },
    {
      "name": "utils.js",
      "content": "bW9kdWxlLmV4cG9ydHMgPSB7CiAgZm9ybWF0TnVtYmVyOiAobnVtKSA9PiBgUmVzdWx0OiAke251bX1gCn07"
    },
    {
      "name": "calculator.js",
      "content": "bW9kdWxlLmV4cG9ydHMgPSB7CiAgYWRkOiAoYSwgYikgPT4gYSArIGIsCiAgc3VidHJhY3Q6IChhLCBiKSA9PiBhIC0gYgp9Ow=="
    }
  ],
  "stdin": "",
  "isBase64Encoded": true
}
```

### Response Format

```json
{
  "message": "Code execution completed",
  "result": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "stdout": "Result: 15\n",
    "stderr": "",
    "compilationOutput": "",
    "executionTime": 42,
    "memoryUsage": 1024,
    "exitCode": 0,
    "success": true
  }
}
```

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Rate limiting to prevent abuse
- Helmet for setting security-related HTTP headers
- Input validation with Yup
- Error logging with Winston

## API Documentation

The API documentation is available via Swagger UI at `/api-docs` when the server is running.

## License

MIT License
