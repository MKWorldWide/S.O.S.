// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - AUTHENTICATION SERVICE
// =============================================================================
// Authentication and authorization service for user management
// Handles login, registration, password management, and session control

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Repository } from 'typeorm';
import { AppDataSource } from '@/database';
import { User, UserRole, UserStatus } from '@/database/entities/User';
import { info, logError, warn } from '@/utils/logger';
import config from '@/config';
import { JwtPayload } from 'jsonwebtoken';

// =============================================================================
// INTERFACES
// =============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationConfirm {
  token: string;
}

// =============================================================================
// AUTHENTICATION SERVICE
// =============================================================================

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  // =============================================================================
  // USER REGISTRATION
  // =============================================================================

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: data.email },
          { username: data.username }
        ]
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Create new user
      const user = this.userRepository.create({
        username: data.username,
        email: data.email,
        password: data.password, // Will be hashed by entity hook
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: data.role || UserRole.VIEWER,
        status: UserStatus.PENDING_VERIFICATION,
        emailVerified: false,
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();

      // Save user
      await this.userRepository.save(user);

      // Send verification email (would be implemented)
      await this.sendVerificationEmail(user.email, verificationToken);

      info(`New user registered: ${user.email}`);

      // Generate tokens
      const { accessToken, refreshToken, expiresIn } = await this.generateTokens(user);

      return {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error: any) {
      logError('Registration failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // USER LOGIN
  // =============================================================================

  /**
   * Authenticate user login
   */
  async login(credentials: LoginCredentials, ip: string): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email: credentials.email },
        select: ['id', 'email', 'password', 'status', 'role', 'emailVerified', 'twoFactorEnabled']
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new Error(`Account is ${user.status}. Please contact administrator.`);
      }

      // Verify password
      const isValidPassword = await user.comparePassword(credentials.password);
      if (!isValidPassword) {
        await this.recordFailedLogin(user.email, ip);
        throw new Error('Invalid credentials');
      }

      // Check if email is verified
      if (!user.emailVerified) {
        throw new Error('Please verify your email address before logging in');
      }

      // Update last login
      user.updateLastLogin(ip);
      await this.userRepository.save(user);

      info(`User logged in: ${user.email} from ${ip}`);

      // Generate tokens
      const { accessToken, refreshToken, expiresIn } = await this.generateTokens(user);

      return {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error: any) {
      logError('Login failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // TOKEN MANAGEMENT
  // =============================================================================

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(user: User): { accessToken: string; refreshToken: string; expiresIn: number } {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });

    return { 
      accessToken, 
      refreshToken, 
      expiresIn: parseInt(config.jwt.expiresIn) * 1000 // Convert to milliseconds
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id }
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email }
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; user: Partial<User> }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;
      const user = await this.getUserById(decoded.id);

      if (!user) {
        throw new Error('User not found');
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      const newAccessToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      return {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId }
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new Error('Invalid token');
      }

      return {
        user: user.getPublicProfile(),
        payload: decoded,
      };
    } catch (error: any) {
      logError('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  // =============================================================================
  // PASSWORD MANAGEMENT
  // =============================================================================

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await this.userRepository.save(user);

    // Send password reset email
    await this.sendPasswordResetEmail(user.email, resetToken);
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { passwordResetToken: data.token }
      });

      if (!user || !user.isPasswordResetTokenValid()) {
        throw new Error('Invalid or expired reset token');
      }

      // Update password
      user.password = data.newPassword; // Will be hashed by entity hook
      user.clearPasswordResetToken();
      await this.userRepository.save(user);

      info(`Password reset completed for: ${user.email}`);
    } catch (error: any) {
      logError('Password reset confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'password']
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword; // Will be hashed by entity hook
      await this.userRepository.save(user);

      info(`Password changed for user: ${userId}`);
    } catch (error: any) {
      logError('Password change failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // EMAIL VERIFICATION
  // =============================================================================

  /**
   * Request email verification
   */
  async requestEmailVerification(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user || user.emailVerified) {
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 3600000); // 1 hour

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await this.userRepository.save(user);

    // Send verification email
    await this.sendVerificationEmail(user.email, verificationToken);
  }

  /**
   * Confirm email verification
   */
  async confirmEmailVerification(data: EmailVerificationConfirm): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { emailVerificationToken: data.token }
      });

      if (!user || !user.isEmailVerificationTokenValid()) {
        throw new Error('Invalid or expired verification token');
      }

      // Verify email
      user.emailVerified = true;
      user.status = UserStatus.ACTIVE;
      user.clearEmailVerificationToken();
      await this.userRepository.save(user);

      info(`Email verified for: ${user.email}`);
    } catch (error: any) {
      logError('Email verification confirmation failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // USER MANAGEMENT
  // =============================================================================

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user.getPublicProfile();
    } catch (error: any) {
      logError('Get user profile failed:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: Partial<User>): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update allowed fields
      if (data.firstName !== undefined) {
        user.firstName = data.firstName;
      }
      if (data.lastName !== undefined) {
        user.lastName = data.lastName;
      }
      if (data.phoneNumber !== undefined) {
        user.phoneNumber = data.phoneNumber;
      }
      if (data.preferences !== undefined) {
        user.preferences = data.preferences;
      }

      await this.userRepository.save(user);

      info(`Profile updated for user: ${userId}`);

      return user.getPublicProfile();
    } catch (error: any) {
      logError('Update user profile failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just log the logout
      info(`User logged out: ${userId}`);
    } catch (error: any) {
      logError('Logout failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // SECURITY FEATURES
  // =============================================================================

  /**
   * Record failed login attempt
   */
  private async recordFailedLogin(email: string, ip: string): Promise<void> {
    try {
      warn(`Failed login attempt for: ${email} from ${ip}`);
      
      // In a real implementation, you might want to:
      // - Track failed attempts
      // - Implement account lockout
      // - Send security alerts
    } catch (error: any) {
      logError('Failed to record failed login:', error);
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return false;
      }

      // Simple role-based permission check
      const permissions = {
        [UserRole.ADMIN]: ['*'],
        [UserRole.OPERATOR]: ['read', 'write', 'manage_tanks'],
        [UserRole.EMERGENCY_RESPONDER]: ['read', 'emergency_access'],
        [UserRole.VIEWER]: ['read'],
      };

      const userPermissions = permissions[user.role] || [];
      return userPermissions.includes('*') || userPermissions.includes(permission);
    } catch (error: any) {
      logError('Permission check failed:', error);
      return false;
    }
  }

  // =============================================================================
  // EMAIL SERVICES (PLACEHOLDERS)
  // =============================================================================

  /**
   * Send verification email
   */
  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    // This would integrate with your email service
    info(`Verification email sent to: ${email}`);
  }

  /**
   * Send password reset email
   */
  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // This would integrate with your email service
    info(`Password reset email sent to: ${email}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token }
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    user.passwordChangedAt = new Date();
    user.clearPasswordReset();
    await this.userRepository.save(user);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token }
    });

    if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new Error('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.clearEmailVerification();
    await this.userRepository.save(user);
  }
}

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

export default new AuthService(); 