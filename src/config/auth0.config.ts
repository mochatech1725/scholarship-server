
import { 
  NODE_ENV, 
  PORT, 
  APP_DEBUG, 
  APP_SECRET, 
  AUTH0_ISSUER_BASE_URL, 
  AUTH0_AUDIENCE,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET
} from '../utils/constants.js';

const auth0Config = {
  env: NODE_ENV,
  port: PORT,
  debug: APP_DEBUG,
  appSecret: APP_SECRET,
  issuerBaseUrl: AUTH0_ISSUER_BASE_URL,
  audience: AUTH0_AUDIENCE,
  clientId: AUTH0_CLIENT_ID,
  clientSecret: AUTH0_CLIENT_SECRET,
};

export default auth0Config; 