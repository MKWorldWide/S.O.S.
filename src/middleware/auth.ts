// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - AUTHENTICATION MIDDLEWARE
// =============================================================================
// JWT token authentication middleware
// Verifies and validates JWT tokens for protected routes

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '@/config';
import { logError } from '@/utils/logger';

// =============================================================================
// INTERFACES
// =============================================================================

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Authenticate JWT token middleware
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    jwt.verify(token, config.jwt.secret, (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token has expired'
          });
        }
        
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token'
          });
        }

        return res.status(401).json({
          success: false,
          message: 'Token verification failed'
        });
      }

      req.user = decoded as JwtPayload;
      next();
    });
  } catch (error) {
    logError('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, config.jwt.secret, (err: any, decoded: any) => {
        if (!err) {
          req.user = decoded as JwtPayload;
        }
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Verify refresh token middleware
 */
export const verifyRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    jwt.verify(refreshToken, config.jwt.refreshSecret, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      req.body.userId = decoded.id;
      next();
    });
  } catch (error) {
    logError('Refresh token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

/**
 * Get user from token (utility function)
 */
export const getUserFromToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}; 