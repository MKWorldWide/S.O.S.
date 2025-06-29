// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - USER ENTITY
// =============================================================================
// User entity for authentication and authorization
// Handles user accounts, roles, and permissions

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { IsEmail, MinLength, IsEnum } from 'class-validator';
import * as bcrypt from 'bcrypt';

// =============================================================================
// ENUMS
// =============================================================================

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  EMERGENCY_RESPONDER = 'emergency_responder',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

// =============================================================================
// USER ENTITY
// =============================================================================

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @MinLength(3)
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail()
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  @MinLength(8)
  password: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  twoFactorSecret: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp: string;

  @Column({ type: 'text', nullable: true })
  preferences: string; // JSON string for user preferences

  @Column({ type: 'text', nullable: true })
  emergencyContacts: string; // JSON string for emergency contacts

  @Column({ type: 'boolean', default: true })
  notificationsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  emailNotificationsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  smsNotificationsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  pushNotificationsEnabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  passwordChangedAt: Date;

  @Column({ nullable: true })
  passwordResetToken: string | null;

  @Column({ nullable: true })
  passwordResetExpires: Date | null;

  @Column({ nullable: true })
  emailVerificationToken: string | null;

  @Column({ nullable: true })
  emailVerificationExpires: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // =============================================================================
  // HOOKS
  // =============================================================================

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && this.password.length < 60) {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
      this.passwordChangedAt = new Date();
    }
  }

  // =============================================================================
  // METHODS
  // =============================================================================

  /**
   * Compare password with hashed password
   */
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Get full name
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Check if user has admin privileges
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Check if user is active
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * Get user preferences as object
   */
  getPreferences(): Record<string, any> {
    try {
      return this.preferences ? JSON.parse(this.preferences) : {};
    } catch {
      return {};
    }
  }

  /**
   * Set user preferences
   */
  setPreferences(preferences: Record<string, any>): void {
    this.preferences = JSON.stringify(preferences);
  }

  /**
   * Get emergency contacts as array
   */
  getEmergencyContacts(): Array<{
    name: string;
    phone: string;
    email?: string;
    relationship: string;
  }> {
    try {
      return this.emergencyContacts ? JSON.parse(this.emergencyContacts) : [];
    } catch {
      return [];
    }
  }

  /**
   * Set emergency contacts
   */
  setEmergencyContacts(contacts: Array<{
    name: string;
    phone: string;
    email?: string;
    relationship: string;
  }>): void {
    this.emergencyContacts = JSON.stringify(contacts);
  }

  /**
   * Update last login information
   */
  updateLastLogin(ip: string): void {
    this.lastLoginAt = new Date();
    this.lastLoginIp = ip;
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(): string {
    const token = require('crypto').randomBytes(32).toString('hex');
    this.passwordResetToken = token;
    this.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    return token;
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(): string {
    const token = require('crypto').randomBytes(32).toString('hex');
    this.emailVerificationToken = token;
    this.emailVerificationExpires = new Date(Date.now() + 86400000); // 24 hours
    return token;
  }

  /**
   * Clear password reset token
   */
  clearPasswordReset(): void {
    this.passwordResetToken = null;
    this.passwordResetExpires = null;
  }

  /**
   * Clear email verification token
   */
  clearEmailVerification(): void {
    this.emailVerificationToken = null;
    this.emailVerificationExpires = null;
  }

  /**
   * Check if password reset token is valid
   */
  isPasswordResetTokenValid(): boolean {
    return !!(
      this.passwordResetToken &&
      this.passwordResetExpires &&
      this.passwordResetExpires > new Date()
    );
  }

  /**
   * Check if email verification token is valid
   */
  isEmailVerificationTokenValid(): boolean {
    return !!(
      this.emailVerificationToken &&
      this.emailVerificationExpires &&
      this.emailVerificationExpires > new Date()
    );
  }

  /**
   * Get public profile (without sensitive data)
   */
  getPublicProfile() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.getFullName(),
      role: this.role,
      status: this.status,
      emailVerified: this.emailVerified,
      twoFactorEnabled: this.twoFactorEnabled,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
} 