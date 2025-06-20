// import { Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import { AuthRequest, JwtPayload } from '../types';

// export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const authHeader = req.headers.authorization;
//     const token = authHeader?.replace('Bearer ', '');

//     if (!token) {
//       throw new Error();
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
//     req.user = decoded;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Please authenticate.' });
//   }
// }; 

import { auth } from "express-oauth2-jwt-bearer";
import auth0Config from "../config/auth0.config.js";

console.log('Auth0 Config:', {
  audience: auth0Config.audience,
  issuerBaseURL: auth0Config.issuerBaseUrl,
  hasAudience: !!auth0Config.audience,
  hasIssuer: !!auth0Config.issuerBaseUrl
});

const authenticateUser = auth({
  audience: auth0Config.audience,
  issuerBaseURL: auth0Config.issuerBaseUrl,
});

export default authenticateUser;