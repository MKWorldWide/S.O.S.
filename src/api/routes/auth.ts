// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - AUTHENTICATION ROUTES
// =============================================================================
// Authentication API routes for user management
// Handles login, registration, password management, and session control

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import authService, { 
  LoginCredentials, 
  RegisterData, 
  PasswordResetRequest, 
  PasswordResetConfirm,
  EmailVerificationRequest,
  EmailVerificationConfirm
} from '@/services/authService';
import { info, logError } from '@/utils/logger';
import { UserRole } from '@/database/entities/User';

const router = Router();

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'technician'])
    .withMessage('Invalid role specified'),
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
];

const validatePasswordResetConfirm = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
];

const validateEmailVerification = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
];

const validateEmailVerificationConfirm = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
];

const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object')
];

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

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
// AUTHENTICATION ROUTES
// =============================================================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRegistration, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const registerData: RegisterData = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phone,
      role: req.body.role,
    };

    const result = await authService.register(registerData);

    info(`New user registered: ${registerData.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: result,
    });
  } catch (error: any) {
    logError('Registration route error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', validateLogin, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const credentials: LoginCredentials = {
      email: req.body.email,
      password: req.body.password,
      rememberMe: req.body.rememberMe,
    };

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const result = await authService.login(credentials, ip);

    info(`User logged in: ${credentials.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    logError('Login route error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const result = await authService.refreshToken(refreshToken);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logError('Token refresh error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success
    const userId = (req as any).user?.userId;
    if (userId) {
      await authService.logout(userId);
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    logError('Logout route error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', validatePasswordReset, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const resetData: PasswordResetRequest = {
      email: req.body.email,
    };

    await authService.requestPasswordReset(resetData);

    res.json({
      success: true,
      message: 'Password reset email sent. Please check your email.',
    });
  } catch (error: any) {
    logError('Password reset request route error:', error);
    // Don't reveal if user exists or not
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset email has been sent.',
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Confirm password reset
 * @access  Public
 */
router.post('/reset-password', validatePasswordResetConfirm, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const resetData: PasswordResetConfirm = {
      token: req.body.token,
      newPassword: req.body.newPassword,
    };

    await authService.confirmPasswordReset(resetData);

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error: any) {
    logError('Password reset confirmation route error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Password reset failed',
    });
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Request email verification
 * @access  Public
 */
router.post('/verify-email', validateEmailVerification, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const verificationData: EmailVerificationRequest = {
      email: req.body.email,
    };

    await authService.requestEmailVerification(verificationData);

    res.json({
      success: true,
      message: 'Verification email sent. Please check your email.',
    });
  } catch (error: any) {
    logError('Email verification request route error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Email verification request failed',
    });
  }
});

/**
 * @route   POST /api/auth/confirm-email
 * @desc    Confirm email verification
 * @access  Public
 */
router.post('/confirm-email', validateEmailVerificationConfirm, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const verificationData: EmailVerificationConfirm = {
      token: req.body.token,
    };

    await authService.confirmEmailVerification(verificationData);

    res.json({
      success: true,
      message: 'Email verified successfully. You can now login.',
    });
  } catch (error: any) {
    logError('Email verification confirmation route error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Email verification failed',
    });
  }
});

// =============================================================================
// PROTECTED ROUTES
// =============================================================================

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await authService.getUserProfile(userId);
    
    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logError('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', validateProfileUpdate, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const updateData = req.body;
    const updatedUser = await authService.updateUserProfile(userId, updateData);
    
    return res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    logError('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', validatePasswordChange, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(userId, currentPassword, newPassword);
    
    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logError('Change password error:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to change password'
    });
  }
});

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify JWT token
 * @access  Public
 */
router.get('/verify-token', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = await authService.verifyToken(token);
    
    return res.json({
      success: true,
      data: decoded
    });
  } catch (error) {
    logError('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// =============================================================================
// EXPORT
// =============================================================================

export default router; 