// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - ERROR HANDLING UTILITIES
// =============================================================================
// Comprehensive error handling system with custom error classes and middleware
// Provides structured error responses and logging for the S.O.S. system

import { Request, Response, NextFunction } from 'express';
import logger from './logger';

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  public readonly field: string;
  public readonly value: any;

  constructor(message: string, field: string, value?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
    this.value = value;
  }
}

/**
 * Authentication error for unauthorized access
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization error for insufficient permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

/**
 * Conflict error for resource conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Database operation error
 */
export class DatabaseError extends AppError {
  public readonly originalError: Error | undefined;

  constructor(message: string, originalError?: Error) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;
  public readonly originalError: Error | undefined;

  constructor(service: string, message: string, originalError?: Error) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
    this.originalError = originalError;
  }
}

// =============================================================================
// ERROR FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a validation error
 */
export const createValidationError = (field: string, message: string, value?: any): ValidationError => {
  return new ValidationError(message, field, value);
};

/**
 * Create a database error
 */
export const createDatabaseError = (message: string, originalError?: Error): DatabaseError => {
  return new DatabaseError(message, originalError);
};

/**
 * Create an external service error
 */
export const createExternalServiceError = (service: string, message: string, originalError?: Error): ExternalServiceError => {
  return new ExternalServiceError(service, message, originalError);
};

// =============================================================================
// ERROR RESPONSE FORMATTERS
// =============================================================================

/**
 * Format error response for API
 */
export const formatErrorResponse = (error: AppError | Error): any => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: error.timestamp.toISOString(),
        ...(error instanceof ValidationError && { field: error.field }),
        ...(error instanceof DatabaseError && { 
          originalError: error.originalError?.message 
        }),
        ...(error instanceof ExternalServiceError && { 
          service: error.service,
          originalError: error.originalError?.message 
        }),
      },
    };
  }

  // Handle generic errors
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    },
  };
};

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let appError: AppError;

  // Convert to AppError if it's not already
  if (error instanceof AppError) {
    appError = error;
  } else {
    appError = new AppError(
      error.message || 'An unexpected error occurred',
      500,
      'INTERNAL_ERROR',
      false
    );
  }

  // Log the error
  logger.error(`Error occurred: ${appError.message}`, {
    code: appError.code,
    statusCode: appError.statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: appError.stack,
  });

  // Send error response
  const errorResponse = formatErrorResponse(appError);
  res.status(appError.statusCode).json(errorResponse);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  
  logger.warn(`Route not found: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const errorResponse = formatErrorResponse(error);
  res.status(404).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// =============================================================================
// ERROR VALIDATION UTILITIES
// =============================================================================

/**
 * Validate error object structure
 */
export const isValidError = (error: any): error is AppError => {
  return (
    error instanceof AppError ||
    (error && 
     typeof error.message === 'string' &&
     typeof error.statusCode === 'number' &&
     typeof error.code === 'string')
  );
};

/**
 * Check if error is operational (expected)
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Check if error should be reported to monitoring services
 */
export const shouldReportError = (error: Error): boolean => {
  // Report all non-operational errors
  if (!isOperationalError(error)) {
    return true;
  }

  // Report specific error types
  if (error instanceof DatabaseError || error instanceof ExternalServiceError) {
    return true;
  }

  // Report high severity errors
  if (error instanceof AppError && error.statusCode >= 500) {
    return true;
  }

  return false;
};

// =============================================================================
// ERROR MONITORING
// =============================================================================

/**
 * Report error to monitoring services
 */
export const reportError = (error: Error, context?: Record<string, any>): void => {
  if (shouldReportError(error)) {
    logger.error(`Error reported to monitoring: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // TODO: Integrate with external monitoring services
    // - Sentry
    // - LogRocket
    // - New Relic
    // - DataDog
  }
};

/**
 * Error metrics tracking
 */
export const trackErrorMetrics = (error: Error): void => {
  const errorType = error.constructor.name;
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  logger.info('Error metric tracked', {
    errorType,
    statusCode,
    timestamp: new Date().toISOString(),
  });

  // TODO: Integrate with metrics collection
  // - Prometheus
  // - StatsD
  // - Custom metrics
};

// =============================================================================
// DEVELOPMENT ERROR HELPERS
// =============================================================================

/**
 * Enhanced error logging for development
 */
export const logErrorDetails = (error: Error, context?: Record<string, any>): void => {
  logger.error('Detailed error information', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Create error summary for debugging
 */
export const createErrorSummary = (error: Error): Record<string, any> => {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack?.split('\n').slice(0, 5), // First 5 stack lines
    timestamp: new Date().toISOString(),
    ...(error instanceof AppError && {
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    }),
  };
}; 