// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - RATE LIMITING UTILITIES
// =============================================================================
// Rate limiting middleware using express-rate-limit
// Provides protection against abuse and ensures fair resource usage

import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import config from '@/config';

// =============================================================================
// RATE LIMITER CONFIGURATIONS
// =============================================================================

/**
 * General rate limiter for all routes
 */
export const generalLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000),
    });
  },
});

/**
 * Authentication rate limiter for login attempts
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts, please try again later.',
    retryAfter: 900, // 15 minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later.',
      retryAfter: 900,
    });
  },
});

/**
 * Sensor data rate limiter for high-frequency data
 */
export const sensorDataLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'SENSOR_RATE_LIMIT_EXCEEDED',
    message: 'Too many sensor data requests, please reduce frequency.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'SENSOR_RATE_LIMIT_EXCEEDED',
      message: 'Too many sensor data requests, please reduce frequency.',
      retryAfter: 60,
    });
  },
});

/**
 * Dashboard rate limiter for real-time updates
 */
export const dashboardLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 50, // 50 requests per 30 seconds
  message: {
    success: false,
    error: 'DASHBOARD_RATE_LIMIT_EXCEEDED',
    message: 'Too many dashboard requests, please wait.',
    retryAfter: 30,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'DASHBOARD_RATE_LIMIT_EXCEEDED',
      message: 'Too many dashboard requests, please wait.',
      retryAfter: 30,
    });
  },
});

/**
 * Admin rate limiter for administrative operations
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    success: false,
    error: 'ADMIN_RATE_LIMIT_EXCEEDED',
    message: 'Too many admin operations, please slow down.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'ADMIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many admin operations, please slow down.',
      retryAfter: 60,
    });
  },
});

/**
 * File upload rate limiter
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    success: false,
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    message: 'Too many file uploads, please wait.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many file uploads, please wait.',
      retryAfter: 60,
    });
  },
});

/**
 * API key rate limiter for external integrations
 */
export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute for API keys
  message: {
    success: false,
    error: 'API_KEY_RATE_LIMIT_EXCEEDED',
    message: 'API key rate limit exceeded.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use API key as the key for rate limiting
    const apiKey = req.headers['x-api-key'] as string;
    return apiKey || req.ip;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'API_KEY_RATE_LIMIT_EXCEEDED',
      message: 'API key rate limit exceeded.',
      retryAfter: 60,
    });
  },
});

// =============================================================================
// CUSTOM RATE LIMITER FACTORIES
// =============================================================================

/**
 * Create a custom rate limiter
 */
export const createCustomLimiter = (
  windowMs: number,
  max: number,
  errorCode: string = 'CUSTOM_RATE_LIMIT_EXCEEDED',
  errorMessage: string = 'Rate limit exceeded'
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: errorCode,
      message: errorMessage,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: errorCode,
        message: errorMessage,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

/**
 * Create a user-specific rate limiter
 */
export const createUserLimiter = (
  windowMs: number,
  max: number,
  errorCode: string = 'USER_RATE_LIMIT_EXCEEDED',
  errorMessage: string = 'User rate limit exceeded'
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: errorCode,
      message: errorMessage,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use user ID if available, otherwise use IP
      const userId = (req as any).user?.id as string;
      return userId || req.ip;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: errorCode,
        message: errorMessage,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

/**
 * Create an IP-based rate limiter
 */
export const createIPLimiter = (
  windowMs: number,
  max: number,
  errorCode: string = 'IP_RATE_LIMIT_EXCEEDED',
  errorMessage: string = 'IP rate limit exceeded'
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: errorCode,
      message: errorMessage,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return req.ip;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: errorCode,
        message: errorMessage,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// =============================================================================
// RATE LIMITING UTILITIES
// =============================================================================

/**
 * Get rate limit info for a request
 */
export const getRateLimitInfo = (req: Request) => {
  const limit = (req as any).rateLimit;
  if (!limit) {
    return null;
  }

  return {
    limit: limit.limit,
    current: limit.current,
    remaining: limit.remaining,
    resetTime: limit.resetTime,
    retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
  };
};

/**
 * Check if request is rate limited
 */
export const isRateLimited = (req: Request): boolean => {
  const limitInfo = getRateLimitInfo(req);
  return limitInfo ? limitInfo.remaining <= 0 : false;
};

/**
 * Get remaining requests for current window
 */
export const getRemainingRequests = (req: Request): number => {
  const limitInfo = getRateLimitInfo(req);
  return limitInfo ? limitInfo.remaining : -1;
};

/**
 * Get reset time for current window
 */
export const getResetTime = (req: Request): Date | null => {
  const limitInfo = getRateLimitInfo(req);
  return limitInfo ? new Date(limitInfo.resetTime) : null;
};

// =============================================================================
// RATE LIMITING MIDDLEWARE HELPERS
// =============================================================================

/**
 * Skip rate limiting for certain conditions
 */
export const skipRateLimit = (req: Request): boolean => {
  // Skip for health checks
  if (req.path === '/health') {
    return true;
  }

  // Skip for internal requests
  if (req.headers['x-internal-request'] === 'true') {
    return true;
  }

  // Skip for whitelisted IPs (if configured)
  const whitelistedIPs = process.env['RATE_LIMIT_WHITELIST']?.split(',') || [];
  if (whitelistedIPs.includes(req.ip)) {
    return true;
  }

  return false;
};

/**
 * Dynamic rate limiter that adjusts based on user role
 */
export const dynamicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req: Request) => {
    // Adjust limits based on user role
    const user = (req as any).user;
    if (user?.role === 'admin') {
      return 1000; // Higher limit for admins
    }
    if (user?.role === 'moderator') {
      return 500; // Medium limit for moderators
    }
    return 100; // Default limit for regular users
  },
  message: {
    success: false,
    error: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded for your user role.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded for your user role.',
    });
  },
}); 