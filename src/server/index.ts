// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - SERVER ENTRY POINT
// =============================================================================
// Main server file that initializes the Express application
// Handles middleware setup, route configuration, and server startup

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';

// Import configuration and utilities
import config from '@/config';
import logger from '@/utils/logger';
import { errorHandler, notFoundHandler } from '../utils/errorHandler';
import { generalLimiter } from '@/utils/rateLimiter';

// =============================================================================
// SERVER CLASS
// =============================================================================

/**
 * Main server class for the S.O.S. system
 */
class SOSServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.server.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middleware
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.server.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    }));

    // Compression middleware
    this.app.use(compression());

    // Request logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        },
      },
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(generalLimiter);

    // Static file serving
    this.app.use(express.static(path.join(__dirname, '../../public')));

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'S.O.S. System is healthy',
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv,
        version: process.env['npm_package_version'] || '1.0.0',
        uptime: process.uptime(),
      });
    });

    // API version middleware
    this.app.use(`/api/${config.server.apiVersion}`, (req: Request, res: Response, next: NextFunction) => {
      (req as any).apiVersion = config.server.apiVersion;
      next();
    });
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    // Placeholder route for development
    this.app.get(`/api/${config.server.apiVersion}/status`, (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'S.O.S. API is running',
        version: config.server.apiVersion,
        timestamp: new Date().toISOString(),
      });
    });

    // Catch-all route for SPA
    this.app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/')) {
        return notFoundHandler(req, res);
      }
      
      // Serve the React app for all other routes
      res.sendFile(path.join(__dirname, '../../public/index.html'));
    });
  }

  /**
   * Initialize WebSocket connections
   */
  private initializeWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      // Join default room
      socket.join('general');

      // Handle sensor data updates
      socket.on('sensor-data', (data) => {
        logger.debug('Received sensor data via WebSocket', { data });
        // Broadcast to all connected clients
        this.io.emit('sensor-data-update', data);
      });

      // Handle alert notifications
      socket.on('alert', (alert) => {
        logger.info('Received alert via WebSocket', { alert });
        // Broadcast to all connected clients
        this.io.emit('alert-notification', alert);
      });

      // Handle client disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`WebSocket client disconnected: ${socket.id}`, { reason });
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`WebSocket error: ${socket.id}`, { error });
      });
    });

    logger.info('WebSocket server initialized');
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Start the server
      this.server.listen(config.server.port, config.server.host, () => {
        logger.info('🚀 S.O.S. Server started successfully');
        logger.info(`📍 Server running at: http://${config.server.host}:${config.server.port}`);
        logger.info(`🌍 Environment: ${config.server.nodeEnv}`);
        logger.info(`📊 API Version: ${config.server.apiVersion}`);
        logger.info(`🔗 Health Check: http://${config.server.host}:${config.server.port}/health`);
        logger.info(`📡 WebSocket: ws://${config.server.host}:${config.server.port}`);
      });

    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }

  /**
   * Stop the server gracefully
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('🛑 S.O.S. Server stopped gracefully');
        resolve();
      });
    });
  }

  /**
   * Get the Express app instance
   */
  public getApp(): express.Application {
    return this.app;
  }

  /**
   * Get the Socket.IO instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// =============================================================================
// GRACEFUL SHUTDOWN HANDLING
// =============================================================================

/**
 * Handle graceful shutdown
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Close server
    await server.stop();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// =============================================================================
// SERVER INSTANCE AND STARTUP
// =============================================================================

// Create server instance
const server = new SOSServer();

// Start server if this file is run directly
if (require.main === module) {
  server.start().catch((error) => {
    logger.error('Failed to start server', { error });
    process.exit(1);
  });
}

// Export server instance for testing
export default server; 