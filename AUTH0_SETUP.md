# Auth0 Integration Setup

This application has been integrated with Auth0 for secure authentication. Follow these steps to set up Auth0 for your scholarship server.

## Prerequisites

1. An Auth0 account (sign up at [auth0.com](https://auth0.com))
2. Node.js and npm installed
3. MongoDB running locally or a cloud MongoDB instance

## Auth0 Setup

### 1. Create an Auth0 Application

1. Log in to your Auth0 dashboard
2. Go to "Applications" → "Create Application"
3. Choose "Machine to Machine Applications" or "Single Page Application" depending on your frontend
4. Name your application (e.g., "Scholarship Server")

### 2. Create an Auth0 API

1. Go to "APIs" → "Create API"
2. Name your API (e.g., "Scholarship API")
3. Set the identifier (e.g., `https://your-api-identifier`)
4. Choose "RS256" as the signing algorithm

### 3. Configure Application Settings

1. Go to your application settings
2. Note down the following values:
   - **Domain** (e.g., `your-tenant.auth0.com`)
   - **Client ID**
   - **Client Secret**

### 4. Configure API Permissions

1. Go to your API settings
2. Under "Permissions", add any custom permissions you need
3. Go to your application settings
4. Under "APIs", authorize your application to use the API
5. Grant the necessary permissions

## Environment Variables

Copy the `env.example` file to `.env` and fill in your Auth0 credentials:

```bash
cp env.example .env
```

Update the `.env` file with your Auth0 values:

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

## API Endpoints

### Public Endpoints
- `GET /` - Welcome message
- `GET /health` - Health check

### Protected Endpoints (require Auth0 token)
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/me` - Check authentication status
- `GET /api/scholarships` - Get scholarships (protected)

## Authentication Flow

1. **Frontend**: User logs in through Auth0 (using Auth0's login page or SDK)
2. **Frontend**: Receives an access token from Auth0
3. **Frontend**: Includes the token in API requests in the Authorization header:
   ```
   Authorization: Bearer <access_token>
   ```
4. **Backend**: Validates the token using Auth0's JWT verification
5. **Backend**: Creates or updates user record in MongoDB based on Auth0 profile

## Testing the Integration

1. Start the server:
   ```bash
   npm run dev
   ```

2. Test the health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

3. Test a protected endpoint (this will fail without a valid token):
   ```bash
   curl http://localhost:3000/api/auth/profile
   ```

4. To test with a valid token, you'll need to:
   - Set up a frontend application with Auth0 SDK
   - Log in through Auth0
   - Use the received access token in your API requests

## Database Changes

The Person model has been updated to support Auth0:
- Added `auth0Id` field to link with Auth0 user ID
- Made `password` field optional (Auth0 handles authentication)
- Made `phoneNumber` field optional

## Security Features

- JWT tokens are validated using Auth0's public keys
- No password storage in the database
- CORS protection
- Helmet security headers
- Request logging with Morgan

## Troubleshooting

1. **"Invalid audience" error**: Check that `AUTH0_AUDIENCE` matches your API identifier
2. **"Invalid issuer" error**: Check that `AUTH0_ISSUER_BASE_URL` matches your Auth0 domain
3. **CORS errors**: Update `CORS_ORIGIN` to match your frontend URL
4. **Database connection errors**: Check your MongoDB connection string

## Next Steps

1. Set up a frontend application with Auth0 SDK
2. Configure Auth0 rules/actions for custom user metadata if needed
3. Add role-based access control using Auth0 permissions
4. Set up Auth0 hooks for additional user profile management 