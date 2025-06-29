// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - AUTHORIZATION MIDDLEWARE
// =============================================================================
// Role-based authorization middleware
// Controls access to routes based on user roles and permissions

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@/database/entities/User';
import { logError } from '@/utils/logger';

// =============================================================================
// INTERFACES
// =============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Require specific roles middleware
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      logError('Authorization middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed'
      });
    }
  };
};

/**
 * Require admin role middleware
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  return requireRole([UserRole.ADMIN])(req, res, next);
};

/**
 * Require operator or admin role middleware
 */
export const requireOperator = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  return requireRole([UserRole.ADMIN, UserRole.OPERATOR])(req, res, next);
};

/**
 * Require emergency responder or admin role middleware
 */
export const requireEmergencyResponder = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  return requireRole([UserRole.ADMIN, UserRole.EMERGENCY_RESPONDER])(req, res, next);
};

/**
 * Check if user owns resource middleware
 */
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (!resourceUserId) {
        return res.status(400).json({
          success: false,
          message: 'Resource user ID is required'
        });
      }

      // Allow if user owns the resource or is admin
      if (req.user.id === resourceUserId || req.user.role === UserRole.ADMIN) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied to this resource'
      });
    } catch (error) {
      logError('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed'
      });
    }
  };
};

/**
 * Check if user has permission for specific action
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Define permission mappings
      const permissions = {
        [UserRole.ADMIN]: ['*'], // Admin has all permissions
        [UserRole.OPERATOR]: [
          'tank:read',
          'tank:update',
          'tank:assign',
          'alert:read',
          'alert:acknowledge',
          'user:read'
        ],
        [UserRole.EMERGENCY_RESPONDER]: [
          'tank:read',
          'alert:read',
          'alert:acknowledge',
          'emergency:respond'
        ],
        [UserRole.VIEWER]: [
          'tank:read',
          'alert:read'
        ]
      };

      const userPermissions = permissions[req.user.role] || [];
      
      if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: `Permission '${permission}' is required`
        });
      }

      next();
    } catch (error) {
      logError('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed'
      });
    }
  };
};

/**
 * Check if user can access tank
 */
export const requireTankAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const tankId = req.params.tankId || req.params.id;
    
    if (!tankId) {
      return res.status(400).json({
        success: false,
        message: 'Tank ID is required'
      });
    }

    // Admin can access all tanks
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // For now, allow all authenticated users to access tanks
    // In a real implementation, you would check if the user is assigned to the tank
    // or has specific permissions for that tank
    next();
  } catch (error) {
    logError('Tank access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization failed'
    });
  }
};

/**
 * Check if user can access alert
 */
export const requireAlertAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const alertId = req.params.alertId || req.params.id;
    
    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: 'Alert ID is required'
      });
    }

    // Admin can access all alerts
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // For now, allow all authenticated users to access alerts
    // In a real implementation, you would check if the user has access to the tank
    // associated with the alert or has specific permissions
    next();
  } catch (error) {
    logError('Alert access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization failed'
    });
  }
}; 