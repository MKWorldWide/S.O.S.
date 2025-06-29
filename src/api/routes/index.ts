// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - MAIN API ROUTER
// =============================================================================
// Central router that combines all API route modules
// Provides versioning and route organization

import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import tankRoutes from './tanks';
import { logError } from '@/utils/logger';

const router = Router();

// =============================================================================
// API VERSIONING
// =============================================================================

const API_VERSION = 'v1';

// =============================================================================
// ROUTES
// =============================================================================

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'S.O.S. API is running',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API documentation endpoint
router.get('/docs', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'S.O.S. API Documentation',
    version: API_VERSION,
    endpoints: {
      auth: {
        description: 'Authentication and user management',
        basePath: `/api/${API_VERSION}/auth`,
        endpoints: [
          'POST /register - Register new user',
          'POST /login - User login',
          'POST /refresh - Refresh access token',
          'POST /logout - User logout',
          'GET /profile - Get user profile',
          'PUT /profile - Update user profile',
          'POST /change-password - Change password',
          'POST /forgot-password - Request password reset',
          'POST /reset-password - Reset password',
          'POST /verify-email - Verify email address',
          'GET /verify-token - Verify JWT token'
        ]
      },
      tanks: {
        description: 'Oxygen tank management and monitoring',
        basePath: `/api/${API_VERSION}/tanks`,
        endpoints: [
          'GET / - Get all tanks',
          'GET /statistics - Get tank statistics',
          'GET /attention - Get tanks requiring attention',
          'GET /:id - Get tank by ID',
          'POST / - Create new tank',
          'PUT /:id - Update tank',
          'DELETE /:id - Delete tank',
          'POST /readings - Update tank readings',
          'POST /:id/assign - Assign tank to user',
          'POST /:id/unassign - Unassign tank from user',
          'POST /:id/maintenance/schedule - Schedule maintenance',
          'POST /:id/maintenance/complete - Complete maintenance'
        ]
      }
    }
  });
});

// Mount route modules
router.use(`/${API_VERSION}/auth`, authRoutes);
router.use(`/${API_VERSION}/tanks`, tankRoutes);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler for undefined routes
router.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    version: API_VERSION
  });
});

// Global error handler
router.use((error: any, req: Request, res: Response, next: Function) => {
  logError('API error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

export default router; 