// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - SERVER ENTRY POINT
// =============================================================================
// Main server entry point for the S.O.S. system
// Handles server initialization, middleware setup, and graceful shutdown

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { info, logError, warn } from '@/utils/logger';
import config from '@/config';
import { initializeDatabase, closeDatabase, seedDatabase } from '@/database';
import apiRoutes from '@/api/routes';
import { errorHandler } from '@/utils/errorHandler';
import { generalLimiter } from '@/utils/rateLimiter';

// =============================================================================
// SERVER INITIALIZATION
// =============================================================================

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.server.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// Request logging
app.use((req, res, next) => {
  info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  next();
});

// =============================================================================
// ROUTES
// =============================================================================

// API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sovereign Oxygen System (S.O.S.) API',
    version: '1.0.0',
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api/v1',
      health: '/api/v1/health',
      docs: '/api/v1/docs',
    },
  });
});

// =============================================================================
// SOCKET.IO SETUP
// =============================================================================

io.on('connection', (socket) => {
  info(`Client connected: ${socket.id}`);

  // Handle tank monitoring updates
  socket.on('subscribe-tank', (tankId: string) => {
    socket.join(`tank-${tankId}`);
    info(`Client ${socket.id} subscribed to tank ${tankId}`);
  });

  // Handle alert subscriptions
  socket.on('subscribe-alerts', () => {
    socket.join('alerts');
    info(`Client ${socket.id} subscribed to alerts`);
  });

  // Handle emergency notifications
  socket.on('subscribe-emergency', () => {
    socket.join('emergency');
    info(`Client ${socket.id} subscribed to emergency notifications`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    info(`Client disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    logError(`Socket error for ${socket.id}:`, error);
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Global error handler
app.use(errorHandler);

// Socket.IO error handling
io.on('error', (error) => {
  logError('Socket.IO error:', error);
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

const gracefulShutdown = async (signal: string) => {
  info(`Received ${signal}. Starting graceful shutdown...`);

  // Close HTTP server
  server.close(() => {
    info('HTTP server closed');
  });

  // Close Socket.IO server
  io.close(() => {
    info('Socket.IO server closed');
  });

  // Close database connection
  try {
    await closeDatabase();
    info('Database connection closed');
  } catch (error) {
    logError('Error closing database:', error);
  }

  // Exit process
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection', { promise, reason });
  process.exit(1);
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const startServer = async () => {
  try {
    // Initialize database
    info('Initializing database...');
    await initializeDatabase();

    // Seed database with initial data
    if (config.development.debug) {
      info('Seeding database...');
      await seedDatabase();
    }

    // Start server
    const port = config.server.port;
    server.listen(port, () => {
      info(`🚀 S.O.S. Server running on port ${port}`);
      info(`📊 Environment: ${config.server.nodeEnv}`);
      info(`🌐 CORS Origin: ${config.server.corsOrigin}`);
      info(`📚 API Documentation: http://localhost:${port}/api/v1/docs`);
      info(`❤️ Health Check: http://localhost:${port}/api/v1/health`);
      
      if (config.development.debug) {
        info('🔧 Development mode enabled');
        info('🐛 Debug logging enabled');
      }
    });

  } catch (error: any) {
    logError('Failed to start server:', error);
    process.exit(1);
  }
};

// =============================================================================
// EXPORT
// =============================================================================

export { app, server, io };

// Start server if this file is run directly
if (require.main === module) {
  startServer();
} 