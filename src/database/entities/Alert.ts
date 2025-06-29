// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - ALERT ENTITY
// =============================================================================
// Alert entity for managing system alerts, notifications, and emergency responses
// Handles alert creation, escalation, acknowledgment, and resolution tracking

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { User } from './User';
import { OxygenTank } from './OxygenTank';

// =============================================================================
// ENUMS
// =============================================================================

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  DISMISSED = 'dismissed',
}

export enum AlertType {
  // Tank-related alerts
  TANK_LOW_PRESSURE = 'tank_low_pressure',
  TANK_HIGH_PRESSURE = 'tank_high_pressure',
  TANK_LOW_LEVEL = 'tank_low_level',
  TANK_CRITICAL_LEVEL = 'tank_critical_level',
  TANK_LEAK_DETECTED = 'tank_leak_detected',
  TANK_DAMAGE_DETECTED = 'tank_damage_detected',
  TANK_DISCONNECTED = 'tank_disconnected',
  TANK_MAINTENANCE_DUE = 'tank_maintenance_due',
  TANK_EXPIRED = 'tank_expired',

  // System alerts
  SYSTEM_ERROR = 'system_error',
  SYSTEM_OFFLINE = 'system_offline',
  DATABASE_ERROR = 'database_error',
  NETWORK_ERROR = 'network_error',
  SENSOR_ERROR = 'sensor_error',
  COMMUNICATION_ERROR = 'communication_error',

  // Safety alerts
  SAFETY_VIOLATION = 'safety_violation',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  ENVIRONMENTAL_HAZARD = 'environmental_hazard',
  FIRE_HAZARD = 'fire_hazard',
  CHEMICAL_SPILL = 'chemical_spill',

  // User alerts
  USER_LOGIN_FAILURE = 'user_login_failure',
  USER_ACCOUNT_LOCKED = 'user_account_locked',
  USER_PERMISSION_DENIED = 'user_permission_denied',

  // Emergency alerts
  EMERGENCY_SITUATION = 'emergency_situation',
  EVACUATION_REQUIRED = 'evacuation_required',
  MEDICAL_EMERGENCY = 'medical_emergency',
  FIRE_ALARM = 'fire_alarm',
  SECURITY_BREACH = 'security_breach',
}

export enum AlertCategory {
  TANK_MONITORING = 'tank_monitoring',
  SYSTEM_MONITORING = 'system_monitoring',
  SAFETY = 'safety',
  SECURITY = 'security',
  MAINTENANCE = 'maintenance',
  EMERGENCY = 'emergency',
  USER_MANAGEMENT = 'user_management',
}

export enum NotificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  VOICE = 'voice',
  PAGER = 'pager',
}

// =============================================================================
// ALERT ENTITY
// =============================================================================

@Entity('alerts')
@Index(['status'])
@Index(['severity'])
@Index(['type'])
@Index(['category'])
@Index(['createdAt'])
@Index(['tankId'])
@Index(['userId'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  title: string;

  @Column({ type: 'text' })
  @IsString()
  message: string;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM,
  })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  @IsEnum(AlertStatus)
  status: AlertStatus;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  @IsEnum(AlertType)
  type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertCategory,
  })
  @IsEnum(AlertCategory)
  category: AlertCategory;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  source: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  location: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  sensorData: {
    pressure?: number;
    level?: number;
    temperature?: number;
    humidity?: number;
    timestamp?: Date;
  };

  @Column({ type: 'varchar', length: 100, nullable: true })
  tankId: string;

  @ManyToOne(() => OxygenTank, { nullable: true })
  @JoinColumn({ name: 'tankId' })
  tank: OxygenTank;

  @Column({ type: 'varchar', length: 100, nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  acknowledgedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'acknowledgedBy' })
  acknowledgedByUser: User;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resolvedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolvedBy' })
  resolvedByUser: User;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  escalatedTo: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'escalatedTo' })
  escalatedToUser: User | null;

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  escalationReason: string | null;

  @Column({ type: 'int', default: 0 })
  escalationLevel: number;

  @Column({ type: 'int', default: 0 })
  acknowledgmentCount: number;

  @Column({ type: 'int', default: 0 })
  notificationCount: number;

  @Column({ type: 'json', nullable: true })
  notificationHistory: Array<{
    method: NotificationMethod;
    recipient: string;
    sentAt: Date;
    status: 'sent' | 'delivered' | 'failed';
    error?: string;
  }>;

  @Column({ type: 'json', nullable: true })
  escalationHistory: Array<{
    level: number;
    escalatedTo: string;
    escalatedAt: Date;
    reason: string;
  }>;

  @Column({ type: 'json', nullable: true })
  actionHistory: Array<{
    action: string;
    performedBy: string;
    performedAt: Date;
    details: string;
  }>;

  @Column({ type: 'boolean', default: false })
  requiresAcknowledgment: boolean;

  @Column({ type: 'boolean', default: false })
  requiresResolution: boolean;

  @Column({ type: 'boolean', default: false })
  autoEscalate: boolean;

  @Column({ type: 'int', default: 300 }) // 5 minutes in seconds
  escalationDelay: number;

  @Column({ type: 'timestamp', nullable: true })
  nextEscalationAt: Date;

  @Column({ type: 'boolean', default: true })
  notificationsEnabled: boolean;

  @Column({ type: 'json', nullable: true })
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
    voice: boolean;
    pager: boolean;
  };

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalReference: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  externalSystem: string;

  @Column({ type: 'json', nullable: true })
  externalData: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recurringPattern: string;

  @Column({ type: 'timestamp', nullable: true })
  nextOccurrence: Date;

  @Column({ type: 'int', default: 0 })
  occurrenceCount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  priority: string;

  @Column({ type: 'boolean', default: false })
  isSilent: boolean;

  @Column({ type: 'boolean', default: false })
  isTest: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // =============================================================================
  // METHODS
  // =============================================================================

  /**
   * Acknowledge the alert
   */
  acknowledge(acknowledgedBy: string, notes?: string): void {
    this.status = AlertStatus.ACKNOWLEDGED;
    this.acknowledgedBy = acknowledgedBy;
    this.acknowledgedAt = new Date();
    this.acknowledgmentCount++;
    
    if (notes) {
      this.notes = this.notes ? `${this.notes}\n${notes}` : notes;
    }

    this.addActionHistory('acknowledged', acknowledgedBy, notes || '');
  }

  /**
   * Resolve the alert
   */
  resolve(resolvedBy: string, resolutionNotes?: string): void {
    this.status = AlertStatus.RESOLVED;
    this.resolvedBy = resolvedBy;
    this.resolvedAt = new Date();
    this.resolutionNotes = resolutionNotes || null;

    this.addActionHistory('resolved', resolvedBy, resolutionNotes || '');
  }

  /**
   * Escalate the alert
   */
  escalate(escalatedTo: string, reason: string): void {
    this.status = AlertStatus.ESCALATED;
    this.escalatedTo = escalatedTo;
    this.escalatedAt = new Date();
    this.escalationReason = reason;
    this.escalationLevel++;

    if (!this.escalationHistory) {
      this.escalationHistory = [];
    }

    this.escalationHistory.push({
      level: this.escalationLevel,
      escalatedTo,
      escalatedAt: new Date(),
      reason,
    });

    this.addActionHistory('escalated', escalatedTo, reason);
  }

  /**
   * Dismiss the alert
   */
  dismiss(dismissedBy: string, reason?: string): void {
    this.status = AlertStatus.DISMISSED;
    this.addActionHistory('dismissed', dismissedBy, reason || '');
  }

  /**
   * Add notification to history
   */
  addNotification(
    method: NotificationMethod,
    recipient: string,
    status: 'sent' | 'delivered' | 'failed',
    error?: string
  ): void {
    if (!this.notificationHistory) {
      this.notificationHistory = [];
    }

    this.notificationHistory.push({
      method,
      recipient,
      sentAt: new Date(),
      status,
      error,
    });

    this.notificationCount++;
  }

  /**
   * Add action to history
   */
  private addActionHistory(action: string, performedBy: string, details?: string): void {
    if (!this.actionHistory) {
      this.actionHistory = [];
    }

    this.actionHistory.push({
      action,
      performedBy,
      performedAt: new Date(),
      details: details || '',
    });
  }

  /**
   * Check if alert is urgent
   */
  isUrgent(): boolean {
    return this.severity === AlertSeverity.CRITICAL || this.severity === AlertSeverity.EMERGENCY;
  }

  /**
   * Check if alert needs immediate attention
   */
  needsImmediateAttention(): boolean {
    return (
      this.status === AlertStatus.ACTIVE &&
      (this.isUrgent() || this.requiresAcknowledgment)
    );
  }

  /**
   * Get alert duration in minutes
   */
  getDuration(): number {
    const now = new Date();
    const created = this.createdAt;
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
  }

  /**
   * Get time since acknowledgment
   */
  getTimeSinceAcknowledgment(): number | null {
    if (!this.acknowledgedAt) return null;
    const now = new Date();
    return Math.floor((now.getTime() - this.acknowledgedAt.getTime()) / (1000 * 60));
  }

  /**
   * Get time since resolution
   */
  getTimeSinceResolution(): number | null {
    if (!this.resolvedAt) return null;
    const now = new Date();
    return Math.floor((now.getTime() - this.resolvedAt.getTime()) / (1000 * 60));
  }

  /**
   * Check if alert should be escalated
   */
  shouldEscalate(): boolean {
    if (!this.autoEscalate || this.status !== AlertStatus.ACTIVE) {
      return false;
    }

    const duration = this.getDuration();
    return duration >= this.escalationDelay;
  }

  /**
   * Get alert summary for API response
   */
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      message: this.message,
      severity: this.severity,
      status: this.status,
      type: this.type,
      category: this.category,
      source: this.source,
      location: this.location,
      tankId: this.tankId,
      userId: this.userId,
      acknowledgedBy: this.acknowledgedBy,
      acknowledgedAt: this.acknowledgedAt,
      resolvedBy: this.resolvedBy,
      resolvedAt: this.resolvedAt,
      escalatedTo: this.escalatedTo,
      escalatedAt: this.escalatedAt,
      escalationLevel: this.escalationLevel,
      acknowledgmentCount: this.acknowledgmentCount,
      notificationCount: this.notificationCount,
      requiresAcknowledgment: this.requiresAcknowledgment,
      requiresResolution: this.requiresResolution,
      isUrgent: this.isUrgent(),
      needsImmediateAttention: this.needsImmediateAttention(),
      duration: this.getDuration(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Get alert details for API response
   */
  getDetails() {
    return {
      ...this.getSummary(),
      metadata: this.metadata,
      sensorData: this.sensorData,
      resolutionNotes: this.resolutionNotes,
      escalationReason: this.escalationReason,
      notificationHistory: this.notificationHistory,
      escalationHistory: this.escalationHistory,
      actionHistory: this.actionHistory,
      autoEscalate: this.autoEscalate,
      escalationDelay: this.escalationDelay,
      nextEscalationAt: this.nextEscalationAt,
      notificationsEnabled: this.notificationsEnabled,
      notificationSettings: this.notificationSettings,
      externalReference: this.externalReference,
      externalSystem: this.externalSystem,
      externalData: this.externalData,
      isRecurring: this.isRecurring,
      recurringPattern: this.recurringPattern,
      nextOccurrence: this.nextOccurrence,
      occurrenceCount: this.occurrenceCount,
      notes: this.notes,
      tags: this.tags,
      priority: this.priority,
      isSilent: this.isSilent,
      isTest: this.isTest,
    };
  }
} 