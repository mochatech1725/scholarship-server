import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export interface JwtPayload {
  userId: string;
} 