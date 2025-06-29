// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - LOGGING UTILITIES
// =============================================================================
// Comprehensive logging system using Winston for structured logging
// Provides multiple transports, log levels, and formatting options

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config, { isDevelopment } from '@/config';

// =============================================================================
// LOG LEVELS
// =============================================================================

/**
 * Custom log levels for the S.O.S. system
 * Priority: error > warn > info > debug > silly
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  silly: 4,
};

/**
 * Log level colors for console output
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  silly: 'magenta',
};

// Add colors to Winston
winston.addColors(logColors);

// =============================================================================
// LOG FORMATS
// =============================================================================

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

/**
 * File format for production
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Error format for error logs
 */
const errorFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// =============================================================================
// LOG TRANSPORTS
// =============================================================================

/**
 * Console transport for development
 */
const consoleTransport = new winston.transports.Console({
  level: isDevelopment() ? 'debug' : 'info',
  format: consoleFormat,
});

/**
 * File transport for general logs
 */
const fileTransport = new DailyRotateFile({
  filename: config.logging.file,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: config.logging.maxSize,
  maxFiles: config.logging.maxFiles.toString(),
  level: 'info',
  format: fileFormat,
});

/**
 * Error file transport
 */
const errorFileTransport = new DailyRotateFile({
  filename: config.logging.file.replace('.log', '-error.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: config.logging.maxSize,
  maxFiles: config.logging.maxFiles.toString(),
  level: 'error',
  format: errorFormat,
});

// =============================================================================
// LOGGER INSTANCE
// =============================================================================

/**
 * Main logger instance for the S.O.S. system
 */
const logger = winston.createLogger({
  level: isDevelopment() ? 'debug' : 'info',
  levels: logLevels,
  defaultMeta: {
    service: 'sos-system',
    environment: config.server.nodeEnv,
  },
  transports: [
    fileTransport,
    errorFileTransport,
    ...(isDevelopment() ? [consoleTransport] : []),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      format: errorFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: 'logs/rejections.log',
      format: errorFormat,
    }),
  ],
});

// =============================================================================
// LOGGER METHODS
// =============================================================================

/**
 * Log an emergency message (highest priority)
 * @param message - The message to log
 * @param meta - Additional metadata
 */
export const emergency = (message: string, meta?: any): void => {
  logger.error(`🚨 EMERGENCY: ${message}`, meta);
};

/**
 * Log an alert message
 * @param message - The message to log
 * @param meta - Additional metadata
 */
export const alert = (message: string, meta?: any): void => {
  logger.warn(`⚠️ ALERT: ${message}`, meta);
};

/**
 * Log a critical message
 * @param message - The message to log
 * @param meta - Additional metadata
 */
export const critical = (message: string, meta?: any): void => {
  logger.error(`💥 CRITICAL: ${message}`, meta);
};

/**
 * Log an error message
 * @param message - The message to log
 * @param meta - Additional metadata
 */
export const logError = (message: string, meta?: any): void => {
  logger.error(`❌ ERROR: ${message}`, meta);
};

/**
 * Log a warning message
 * @param message - The message to log
 * @param meta - Additional metadata
 */
export const warn = (message: string, meta?: any): void => {
  logger.warn(`⚠️ WARNING: ${message}`, meta);
};

/**
 * Log an info message
 * @param message - The message to log
 * @param meta - Additional metadata
 */
export const info = (message: string, meta?: any): void => {
  logger.info(`ℹ️ INFO: ${message}`, meta);
};

/**
 * Log a debug message
 * @param message - The message to log
 * @param meta - Additional metadata
 */
export const debug = (message: string, meta?: any): void => {
  logger.debug(`🔍 DEBUG: ${message}`, meta);
};

/**
 * Log a silly message (lowest priority)
 * @param message - The message to log
 * @param meta - Additional metadata
 */
export const silly = (message: string, meta?: any): void => {
  logger.silly(`🤪 SILLY: ${message}`, meta);
};

// =============================================================================
// SPECIALIZED LOGGERS
// =============================================================================

/**
 * Database operation logger
 */
export const dbLogger = {
  query: (sql: string, params?: any[]): void => {
    debug(`Database Query: ${sql}`, { params });
  },
  error: (error: Error, context?: string): void => {
    logError(`Database Error: ${error.message}`, { 
      context, 
      stack: error.stack,
      name: error.name 
    });
  },
  connection: (message: string): void => {
    info(`Database Connection: ${message}`);
  },
};

/**
 * API request logger
 */
export const apiLogger = {
  request: (method: string, url: string, ip: string, userAgent?: string): void => {
    info(`API Request: ${method} ${url}`, { ip, userAgent });
  },
  response: (method: string, url: string, statusCode: number, responseTime: number): void => {
    const level = statusCode >= 400 ? 'warn' : 'info';
    const emoji = statusCode >= 400 ? '⚠️' : '✅';
    logger.log(level, `${emoji} API Response: ${method} ${url} - ${statusCode} (${responseTime}ms)`);
  },
  error: (error: Error, req?: any): void => {
    logError(`API Error: ${error.message}`, { 
      stack: error.stack,
      url: req?.url,
      method: req?.method,
      ip: req?.ip,
    });
  },
};

/**
 * MQTT message logger
 */
export const mqttLogger = {
  connect: (broker: string): void => {
    info(`MQTT Connected to: ${broker}`);
  },
  disconnect: (reason: string): void => {
    warn(`MQTT Disconnected: ${reason}`);
  },
  publish: (topic: string, message: any): void => {
    debug(`MQTT Publish: ${topic}`, { message });
  },
  subscribe: (topic: string): void => {
    info(`MQTT Subscribe: ${topic}`);
  },
  message: (topic: string, payload: any): void => {
    debug(`MQTT Message: ${topic}`, { payload });
  },
  error: (error: Error): void => {
    logError(`MQTT Error: ${error.message}`, { stack: error.stack });
  },
};

/**
 * Sensor data logger
 */
export const sensorLogger = {
  reading: (sensorId: string, value: number, unit: string): void => {
    debug(`Sensor Reading: ${sensorId} = ${value}${unit}`);
  },
  alert: (sensorId: string, threshold: number, currentValue: number): void => {
    alert(`Sensor Alert: ${sensorId} exceeded threshold ${threshold} (current: ${currentValue})`);
  },
  error: (error: Error, sensorId: string): void => {
    logError(`Sensor Error: ${sensorId} - ${error.message}`, { stack: error.stack });
  },
};

/**
 * User activity logger
 */
export const userLogger = {
  login: (userId: string, ip: string): void => {
    info(`User Login: ${userId} from ${ip}`);
  },
  logout: (userId: string): void => {
    info(`User Logout: ${userId}`);
  },
  action: (userId: string, action: string, details?: any): void => {
    info(`User Action: ${userId} - ${action}`, details);
  },
  error: (error: Error, userId: string): void => {
    logError(`User Error: ${userId} - ${error.message}`, { stack: error.stack });
  },
};

/**
 * System health logger
 */
export const healthLogger = {
  check: (component: string, status: 'healthy' | 'unhealthy', details?: any): void => {
    const level = status === 'healthy' ? 'info' : 'warn';
    const emoji = status === 'healthy' ? '✅' : '❌';
    logger.log(level, `${emoji} Health Check: ${component} - ${status}`, details);
  },
  metric: (name: string, value: number, unit?: string): void => {
    debug(`Health Metric: ${name} = ${value}${unit || ''}`);
  },
  alert: (component: string, message: string): void => {
    alert(`Health Alert: ${component} - ${message}`);
  },
};

// =============================================================================
// LOGGING MIDDLEWARE
// =============================================================================

/**
 * Express middleware for request logging
 */
export const requestLogger = (req: any, res: any, next: any): void => {
  const start = Date.now();
  
  // Log the request
  apiLogger.request(req.method, req.url, req.ip, req.get('User-Agent'));
  
  // Override res.end to log the response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): void {
    const responseTime = Date.now() - start;
    apiLogger.response(req.method, req.url, res.statusCode, responseTime);
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Error logging middleware
 */
export const errorLogger = (error: Error, req?: any): void => {
  apiLogger.error(error, req);
};

// =============================================================================
// LOGGING UTILITIES
// =============================================================================

/**
 * Create a child logger with additional context
 * @param context - Additional context to add to all log messages
 * @returns Child logger instance
 */
export const createChildLogger = (context: Record<string, any>) => {
  return winston.createLogger({
    ...logger,
    defaultMeta: {
      ...logger.defaultMeta,
      ...context,
    },
  });
};

/**
 * Log performance metrics
 * @param operation - Name of the operation
 * @param duration - Duration in milliseconds
 * @param metadata - Additional metadata
 */
export const logPerformance = (operation: string, duration: number, metadata?: any): void => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger.log(level, `⏱️ Performance: ${operation} took ${duration}ms`, metadata);
};

/**
 * Log memory usage
 */
export const logMemoryUsage = (): void => {
  const usage = process.memoryUsage();
  debug('Memory Usage', {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
  });
};

/**
 * Log system information
 */
export const logSystemInfo = (): void => {
  info('System Information', {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    version: process.env['npm_package_version'] || '1.0.0',
    environment: config.server.nodeEnv,
    uptime: `${Math.round(process.uptime())}s`,
  });
};

// =============================================================================
// EXPORTS
// =============================================================================

export default logger; 