
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const auth0Config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000"),
  debug: process.env.APP_DEBUG === "true",
  appSecret: process.env.APP_SECRET || "",
  issuerBaseUrl: process.env.AUTH0_ISSUER_BASE_URL || "",
  audience: process.env.AUTH0_AUDIENCE || "",
  clientId: process.env.AUTH0_CLIENT_ID || "",
  clientSecret: process.env.AUTH0_CLIENT_SECRET || "",
};

export default auth0Config; 