// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - OXYGEN TANK ROUTES
// =============================================================================
// API routes for oxygen tank management, monitoring, and operations
// Handles CRUD operations, sensor data, and tank analytics

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { OxygenTankService } from '@/services/oxygenTankService';
import { TankStatus, TankType, TankSize } from '@/database/entities/OxygenTank';
import { UserRole } from '@/database/entities/User';
import { logError, info } from '@/utils/logger';
import { authenticateToken } from '@/middleware/auth';
import { requireRole } from '@/middleware/authorization';

const router = Router();

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

const validateTankCreation = [
  body('tankNumber')
    .isString()
    .isLength({ min: 3, max: 50 })
    .withMessage('Tank number must be between 3 and 50 characters'),
  body('name')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tank name must be between 2 and 100 characters'),
  body('type')
    .isIn(Object.values(TankType))
    .withMessage('Invalid tank type'),
  body('size')
    .isIn(Object.values(TankSize))
    .withMessage('Invalid tank size'),
  body('capacity')
    .isFloat({ min: 0 })
    .withMessage('Capacity must be a positive number'),
  body('location')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
];

const validateTankUpdate = [
  body('name')
    .optional()
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tank name must be between 2 and 100 characters'),
  body('type')
    .optional()
    .isIn(Object.values(TankType))
    .withMessage('Invalid tank type'),
  body('size')
    .optional()
    .isIn(Object.values(TankSize))
    .withMessage('Invalid tank size'),
  body('capacity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Capacity must be a positive number'),
  body('location')
    .optional()
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('status')
    .optional()
    .isIn(Object.values(TankStatus))
    .withMessage('Invalid tank status'),
];

const validateTankReading = [
  body('tankNumber')
    .isString()
    .withMessage('Tank number is required'),
  body('currentLevel')
    .isFloat({ min: 0 })
    .withMessage('Current level must be a positive number'),
  body('currentPressure')
    .isFloat({ min: 0 })
    .withMessage('Current pressure must be a positive number'),
  body('temperature')
    .optional()
    .isFloat()
    .withMessage('Temperature must be a number'),
  body('humidity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Humidity must be between 0 and 100'),
];

const handleValidationErrors = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /api/tanks
 * Get all tanks with optional filters
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as TankStatus,
      type: req.query.type as TankType,
      location: req.query.location as string,
      assignedTo: req.query.assignedTo as string,
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const tanks = await req.app.locals.oxygenTankService.getAllTanks(filters);
    
    return res.json({
      success: true,
      data: tanks
    });
  } catch (error) {
    logError('Get tanks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tanks'
    });
  }
});

/**
 * GET /api/tanks/statistics
 * Get tank statistics
 */
router.get('/statistics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const statistics = await req.app.locals.oxygenTankService.getTankStatistics();
    
    return res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logError('Get tank statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tank statistics'
    });
  }
});

/**
 * GET /api/tanks/attention
 * Get tanks requiring attention
 */
router.get('/attention', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tanks = await req.app.locals.oxygenTankService.getTanksRequiringAttention();
    
    return res.json({
      success: true,
      data: tanks
    });
  } catch (error) {
    logError('Get tanks requiring attention error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tanks requiring attention'
    });
  }
});

/**
 * GET /api/tanks/:id
 * Get tank by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tank = await req.app.locals.oxygenTankService.getTankById(req.params.id);
    
    if (!tank) {
      return res.status(404).json({
        success: false,
        message: 'Tank not found'
      });
    }
    
    return res.json({
      success: true,
      data: tank
    });
  } catch (error) {
    logError('Get tank by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tank'
    });
  }
});

/**
 * POST /api/tanks
 * Create a new tank
 */
router.post('/', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.OPERATOR]),
  validateTankCreation, 
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const tankData = {
        tankNumber: req.body.tankNumber,
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        size: req.body.size,
        capacity: req.body.capacity,
        location: req.body.location,
        assignedTo: req.body.assignedTo,
        notes: req.body.notes,
      };

      const tank = await req.app.locals.oxygenTankService.createTank(tankData);
      
      return res.status(201).json({
        success: true,
        data: tank
      });
    } catch (error) {
      logError('Create tank error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create tank'
      });
    }
  }
);

/**
 * PUT /api/tanks/:id
 * Update tank
 */
router.put('/:id', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.OPERATOR]),
  validateTankUpdate, 
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const tank = await req.app.locals.oxygenTankService.updateTank(req.params.id, req.body);
      
      return res.json({
        success: true,
        data: tank
      });
    } catch (error) {
      logError('Update tank error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update tank'
      });
    }
  }
);

/**
 * DELETE /api/tanks/:id
 * Delete tank
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      await req.app.locals.oxygenTankService.deleteTank(req.params.id);
      
      return res.json({
        success: true,
        message: 'Tank deleted successfully'
      });
    } catch (error) {
      logError('Delete tank error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete tank'
      });
    }
  }
);

/**
 * POST /api/tanks/readings
 * Update tank readings from sensors
 */
router.post('/readings', 
  authenticateToken,
  validateTankReading,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const reading = {
        tankNumber: req.body.tankNumber,
        currentLevel: req.body.currentLevel,
        currentPressure: req.body.currentPressure,
        temperature: req.body.temperature,
        humidity: req.body.humidity,
        timestamp: new Date(),
      };

      const tank = await req.app.locals.oxygenTankService.updateTankReadings(reading);
      
      return res.json({
        success: true,
        data: tank
      });
    } catch (error) {
      logError('Update tank readings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update tank readings'
      });
    }
  }
);

/**
 * POST /api/tanks/:id/assign
 * Assign tank to user
 */
router.post('/:id/assign', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.OPERATOR]),
  [
    body('userId')
      .isUUID()
      .withMessage('Valid user ID is required')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const tank = await req.app.locals.oxygenTankService.assignTank(req.params.id, req.body.userId);
      
      return res.json({
        success: true,
        data: tank
      });
    } catch (error) {
      logError('Assign tank error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to assign tank'
      });
    }
  }
);

/**
 * POST /api/tanks/:id/unassign
 * Unassign tank from user
 */
router.post('/:id/unassign', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.OPERATOR]),
  async (req: Request, res: Response) => {
    try {
      const tank = await req.app.locals.oxygenTankService.unassignTank(req.params.id);
      
      return res.json({
        success: true,
        data: tank
      });
    } catch (error) {
      logError('Unassign tank error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to unassign tank'
      });
    }
  }
);

/**
 * POST /api/tanks/:id/maintenance/schedule
 * Schedule tank maintenance
 */
router.post('/:id/maintenance/schedule', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.OPERATOR]),
  [
    body('maintenanceDate')
      .isISO8601()
      .withMessage('Valid maintenance date is required')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const maintenanceDate = new Date(req.body.maintenanceDate);
      const tank = await req.app.locals.oxygenTankService.scheduleMaintenance(req.params.id, maintenanceDate);
      
      return res.json({
        success: true,
        data: tank
      });
    } catch (error) {
      logError('Schedule maintenance error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to schedule maintenance'
      });
    }
  }
);

/**
 * POST /api/tanks/:id/maintenance/complete
 * Complete tank maintenance
 */
router.post('/:id/maintenance/complete', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.OPERATOR]),
  async (req: Request, res: Response) => {
    try {
      const tank = await req.app.locals.oxygenTankService.completeMaintenance(req.params.id, req.body.notes);
      
      return res.json({
        success: true,
        data: tank
      });
    } catch (error) {
      logError('Complete maintenance error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to complete maintenance'
      });
    }
  }
);

export default router; 