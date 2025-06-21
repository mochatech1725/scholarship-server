import { auth } from "express-oauth2-jwt-bearer";
import auth0Config from "../config/auth0.config.js";

// console.log('Auth0 Config:', {
//   audience: auth0Config.audience,
//   issuerBaseURL: auth0Config.issuerBaseUrl,
//   hasAudience: !!auth0Config.audience,
//   hasIssuer: !!auth0Config.issuerBaseUrl
// });

const authenticateUser = auth({
  audience: auth0Config.audience,
  issuerBaseURL: auth0Config.issuerBaseUrl,
});
export default authenticateUser;