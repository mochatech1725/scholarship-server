# Scholarship Server

A TypeScript-based REST API server for managing scholarships, built with Express, MongoDB, and integrated with Auth0 for secure authentication.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or a MongoDB Atlas account)
- npm or yarn package manager
- Auth0 account (for authentication)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd scholarship-server
```

2. Install dependencies:
```bash
npm install
```

3. Set up Auth0:
   - Follow the instructions in [AUTH0_SETUP.md](./AUTH0_SETUP.md)
   - Create an Auth0 application and API
   - Get your Auth0 credentials

4. Create a `.env` file in the root directory:
```bash
cp env.example .env
```

5. Update the `.env` file with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=3000
APP_DEBUG=true

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/scholarship-server

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Auth0 Configuration
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# App Secret (at least 32 characters long)
APP_SECRET=your-super-secret-key-at-least-32-characters-long
```

6. Build the project:
```bash
npm run build
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Public Endpoints
- `GET /` - Welcome message
- `GET /health` - Health check

### Authentication (Auth0)
- `GET /api/auth/profile` - Get user profile (requires Auth0 token)
- `GET /api/auth/me` - Check authentication status (requires Auth0 token)

### Applications (Protected - requires Auth0 token)
- `GET /api/applications` - Get all applications
- `GET /api/applications/:id` - Get a specific application
- `POST /api/applications` - Create a new application
- `PUT /api/applications/:id` - Update an application
- `DELETE /api/applications/:id` - Delete an application

### Recommenders (Protected - requires Auth0 token)
- `GET /api/recommenders` - Get all recommenders
- `GET /api/recommenders/:id` - Get a specific recommender
- `GET /api/recommenders/:userId` - Get recommenders by user ID
- `POST /api/recommenders` - Create a new recommender
- `PUT /api/recommenders/:id` - Update a recommender
- `DELETE /api/recommenders/:id` - Delete a recommender

## Authentication

This application uses Auth0 for secure authentication. Users must:

1. Log in through Auth0 (frontend integration required)
2. Include the Auth0 access token in API requests:
   ```
   Authorization: Bearer <access_token>
   ```

## Project Structure

```
scholarship-server/
├── src/
│   ├── config/
│   │   ├── auth0.config.ts
│   │   └── databaseConfig.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── application.controller.ts
│   │   ├── recommender.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── Scholarship.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── application.routes.ts
│   │   ├── recommender.routes.ts
│   │   └── users.routes.ts
│   ├── types/
│   ├── errors/
│   └── index.ts
├── env.example
├── AUTH0_SETUP.md
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies Used

- TypeScript
- Express.js
- MongoDB with Mongoose
- Auth0 (authentication)
- Node.js
- CORS
- Helmet (for security)
- Morgan (request logging)

## Security Features

- JWT token validation via Auth0
- CORS protection
- Helmet security headers
- Request logging
- No password storage (handled by Auth0)

## Documentation

- [Auth0 Setup Guide](./AUTH0_SETUP.md) - Detailed instructions for Auth0 configuration
- [API Testing](./src/api-test.http) - HTTP requests for testing the API 