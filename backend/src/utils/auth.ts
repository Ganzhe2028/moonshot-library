import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  tokenType?: 'access' | 'refresh';
}

export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tokenType: 'access'
  };

  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (payload.tokenType && payload.tokenType !== 'access') {
      throw new Error('Invalid token');
    }
    return payload;
  } catch {
    throw new Error('Invalid token');
  }
};

export const generateRefreshToken = (user: User): string => {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tokenType: 'refresh'
  };

  const options: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRES_IN as any };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, options);
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
    if (payload.tokenType && payload.tokenType !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    return payload;
  } catch {
    throw new Error('Invalid refresh token');
  }
};
