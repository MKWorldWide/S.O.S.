// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - OXYGEN TANK ENTITY
// =============================================================================
// Oxygen tank entity for monitoring tank status, levels, and safety
// Handles tank inventory, pressure monitoring, and maintenance tracking

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { IsEnum, IsNumber, Min, Max } from 'class-validator';
import { User } from './User';

// =============================================================================
// ENUMS
// =============================================================================

export enum TankStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DECOMMISSIONED = 'decommissioned',
  EMERGENCY_USE = 'emergency_use',
}

export enum TankType {
  MEDICAL_OXYGEN = 'medical_oxygen',
  INDUSTRIAL_OXYGEN = 'industrial_oxygen',
  EMERGENCY_OXYGEN = 'emergency_oxygen',
  PORTABLE_OXYGEN = 'portable_oxygen',
}

export enum TankSize {
  SMALL = 'small',      // 1-5 liters
  MEDIUM = 'medium',    // 6-20 liters
  LARGE = 'large',      // 21-50 liters
  EXTRA_LARGE = 'extra_large', // 50+ liters
}

export enum PressureUnit {
  PSI = 'psi',
  BAR = 'bar',
  KPA = 'kpa',
  ATM = 'atm',
}

export enum VolumeUnit {
  LITERS = 'liters',
  CUBIC_FEET = 'cubic_feet',
  CUBIC_METERS = 'cubic_meters',
}

// =============================================================================
// OXYGEN TANK ENTITY
// =============================================================================

@Entity('oxygen_tanks')
@Index(['tankNumber'], { unique: true })
@Index(['status'])
@Index(['location'])
export class OxygenTank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  tankNumber: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TankType,
    default: TankType.MEDICAL_OXYGEN,
  })
  @IsEnum(TankType)
  type: TankType;

  @Column({
    type: 'enum',
    enum: TankSize,
    default: TankSize.MEDIUM,
  })
  @IsEnum(TankSize)
  size: TankSize;

  @Column({
    type: 'enum',
    enum: TankStatus,
    default: TankStatus.ACTIVE,
  })
  @IsEnum(TankStatus)
  status: TankStatus;

  @Column({ type: 'varchar', length: 100 })
  location: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  building: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  floor: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  room: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  capacity: number;

  @Column({
    type: 'enum',
    enum: VolumeUnit,
    default: VolumeUnit.LITERS,
  })
  @IsEnum(VolumeUnit)
  capacityUnit: VolumeUnit;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  currentLevel: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  @Max(100)
  fillPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  currentPressure: number;

  @Column({
    type: 'enum',
    enum: PressureUnit,
    default: PressureUnit.PSI,
  })
  @IsEnum(PressureUnit)
  pressureUnit: PressureUnit;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  maxPressure: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  minPressure: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  criticalPressure: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  refillThreshold: number;

  @Column({ type: 'boolean', default: false })
  isConnected: boolean;

  @Column({ type: 'boolean', default: false })
  isLeaking: boolean;

  @Column({ type: 'boolean', default: false })
  isDamaged: boolean;

  @Column({ type: 'boolean', default: true })
  isOperational: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastRefillDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextMaintenanceDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastInspectionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expirationDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serialNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  certificationNumber: string;

  @Column({ type: 'text', nullable: true })
  maintenanceNotes: string;

  @Column({ type: 'text', nullable: true })
  safetyNotes: string;

  @Column({ type: 'json', nullable: true })
  specifications: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  calibrationData: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  totalUsage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  dailyUsage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  weeklyUsage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  monthlyUsage: number;

  @Column({ type: 'timestamp', nullable: true })
  lastReadingAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastAlertAt: Date;

  @Column({ type: 'boolean', default: true })
  monitoringEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  alertsEnabled: boolean;

  @Column({ type: 'json', nullable: true })
  alertSettings: {
    lowPressureThreshold: number;
    highPressureThreshold: number;
    lowLevelThreshold: number;
    leakDetectionEnabled: boolean;
    temperatureMonitoringEnabled: boolean;
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsNumber()
  temperature: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsNumber()
  humidity: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignedTo: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedTo' })
  assignedUser: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastUpdatedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'lastUpdatedBy' })
  lastUpdatedByUser: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // =============================================================================
  // METHODS
  // =============================================================================

  /**
   * Check if tank needs refill
   */
  needsRefill(): boolean {
    return this.fillPercentage <= this.refillThreshold;
  }

  /**
   * Check if tank is in critical condition
   */
  isCritical(): boolean {
    return this.currentPressure <= this.criticalPressure || this.fillPercentage <= 10;
  }

  /**
   * Check if tank needs maintenance
   */
  needsMaintenance(): boolean {
    return this.nextMaintenanceDate && this.nextMaintenanceDate <= new Date();
  }

  /**
   * Check if tank is expired
   */
  isExpired(): boolean {
    return this.expirationDate && this.expirationDate <= new Date();
  }

  /**
   * Get remaining capacity
   */
  getRemainingCapacity(): number {
    return this.capacity - this.currentLevel;
  }

  /**
   * Get estimated time remaining based on current usage
   */
  getEstimatedTimeRemaining(): number {
    if (this.dailyUsage <= 0) return Infinity;
    const remainingCapacity = this.getRemainingCapacity();
    return (remainingCapacity / this.dailyUsage) * 24; // hours
  }

  /**
   * Update tank readings
   */
  updateReadings(
    currentLevel: number,
    currentPressure: number,
    temperature?: number,
    humidity?: number
  ): void {
    this.currentLevel = currentLevel;
    this.currentPressure = currentPressure;
    this.fillPercentage = (currentLevel / this.capacity) * 100;
    this.lastReadingAt = new Date();

    if (temperature !== undefined) this.temperature = temperature;
    if (humidity !== undefined) this.humidity = humidity;

    // Update usage statistics
    this.updateUsageStatistics();
  }

  /**
   * Update usage statistics
   */
  private updateUsageStatistics(): void {
    // This would be implemented with actual usage tracking logic
    // For now, we'll just update the last reading time
    this.lastReadingAt = new Date();
  }

  /**
   * Check for safety issues
   */
  getSafetyIssues(): string[] {
    const issues: string[] = [];

    if (this.isLeaking) issues.push('Tank is leaking');
    if (this.isDamaged) issues.push('Tank is damaged');
    if (this.isCritical()) issues.push('Tank is in critical condition');
    if (this.needsMaintenance()) issues.push('Tank needs maintenance');
    if (this.isExpired()) issues.push('Tank has expired');

    return issues;
  }

  /**
   * Get tank status summary
   */
  getStatusSummary() {
    return {
      id: this.id,
      tankNumber: this.tankNumber,
      name: this.name,
      status: this.status,
      location: this.location,
      currentLevel: this.currentLevel,
      fillPercentage: this.fillPercentage,
      currentPressure: this.currentPressure,
      isOperational: this.isOperational,
      needsRefill: this.needsRefill(),
      isCritical: this.isCritical(),
      safetyIssues: this.getSafetyIssues(),
      lastReadingAt: this.lastReadingAt,
      estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
    };
  }

  /**
   * Get tank details for API response
   */
  getDetails() {
    return {
      id: this.id,
      tankNumber: this.tankNumber,
      name: this.name,
      description: this.description,
      type: this.type,
      size: this.size,
      status: this.status,
      location: this.location,
      building: this.building,
      floor: this.floor,
      room: this.room,
      capacity: this.capacity,
      capacityUnit: this.capacityUnit,
      currentLevel: this.currentLevel,
      fillPercentage: this.fillPercentage,
      currentPressure: this.currentPressure,
      pressureUnit: this.pressureUnit,
      maxPressure: this.maxPressure,
      minPressure: this.minPressure,
      criticalPressure: this.criticalPressure,
      refillThreshold: this.refillThreshold,
      isConnected: this.isConnected,
      isLeaking: this.isLeaking,
      isDamaged: this.isDamaged,
      isOperational: this.isOperational,
      lastRefillDate: this.lastRefillDate,
      nextMaintenanceDate: this.nextMaintenanceDate,
      lastInspectionDate: this.lastInspectionDate,
      expirationDate: this.expirationDate,
      manufacturer: this.manufacturer,
      model: this.model,
      serialNumber: this.serialNumber,
      certificationNumber: this.certificationNumber,
      maintenanceNotes: this.maintenanceNotes,
      safetyNotes: this.safetyNotes,
      specifications: this.specifications,
      totalUsage: this.totalUsage,
      dailyUsage: this.dailyUsage,
      weeklyUsage: this.weeklyUsage,
      monthlyUsage: this.monthlyUsage,
      lastReadingAt: this.lastReadingAt,
      lastAlertAt: this.lastAlertAt,
      monitoringEnabled: this.monitoringEnabled,
      alertsEnabled: this.alertsEnabled,
      alertSettings: this.alertSettings,
      temperature: this.temperature,
      humidity: this.humidity,
      assignedTo: this.assignedTo,
      lastUpdatedBy: this.lastUpdatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
} 