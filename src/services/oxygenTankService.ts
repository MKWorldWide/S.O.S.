// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - OXYGEN TANK SERVICE
// =============================================================================
// Service for managing oxygen tanks, monitoring levels, and handling alerts
// Provides business logic for tank operations and safety protocols

import { Repository } from 'typeorm';
import { OxygenTank, TankStatus, TankType, TankSize } from '@/database/entities/OxygenTank';
import { User } from '@/database/entities/User';
import { Alert, AlertType, AlertSeverity, AlertStatus, AlertCategory } from '@/database/entities/Alert';
import { info, logError, warn } from '@/utils/logger';
import config from '@/config';

// =============================================================================
// INTERFACES
// =============================================================================

interface TankCreateData {
  tankNumber: string;
  name: string;
  description?: string;
  type: TankType;
  size: TankSize;
  capacity: number;
  location: string;
  assignedTo?: string;
  notes?: string;
}

interface TankUpdateData {
  name?: string;
  description?: string;
  type?: TankType;
  size?: TankSize;
  capacity?: number;
  location?: string;
  assignedTo?: string;
  notes?: string;
  status?: TankStatus;
}

interface TankReading {
  tankNumber: string;
  currentLevel: number;
  currentPressure: number;
  temperature?: number;
  humidity?: number;
  timestamp: Date;
}

// =============================================================================
// OXYGEN TANK SERVICE
// =============================================================================

export class OxygenTankService {
  private tankRepository: Repository<OxygenTank>;
  private userRepository: Repository<User>;
  private alertRepository: Repository<Alert>;

  constructor(
    tankRepository: Repository<OxygenTank>,
    userRepository: Repository<User>,
    alertRepository: Repository<Alert>
  ) {
    this.tankRepository = tankRepository;
    this.userRepository = userRepository;
    this.alertRepository = alertRepository;
  }

  // =============================================================================
  // TANK MANAGEMENT
  // =============================================================================

  /**
   * Create a new oxygen tank
   */
  async createTank(data: TankCreateData): Promise<OxygenTank> {
    try {
      const tank = this.tankRepository.create({
        ...data,
        status: TankStatus.ACTIVE,
        currentLevel: data.capacity,
        fillPercentage: 100,
        currentPressure: 0,
        maxPressure: 2200,
        minPressure: 100,
        criticalPressure: 50,
        refillThreshold: 20,
        lastInspectionDate: new Date(),
        nextMaintenanceDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      });

      const savedTank = await this.tankRepository.save(tank);
      info(`Oxygen tank created: ${savedTank.tankNumber}`);
      return savedTank;
    } catch (error) {
      logError('Failed to create oxygen tank:', error);
      throw new Error('Failed to create oxygen tank');
    }
  }

  /**
   * Get tank by ID
   */
  async getTankById(id: string): Promise<OxygenTank | null> {
    try {
      return await this.tankRepository.findOne({
        where: { id },
        relations: ['assignedUser', 'lastUpdatedByUser']
      });
    } catch (error) {
      logError('Failed to get tank by ID:', error);
      throw new Error('Failed to retrieve tank');
    }
  }

  /**
   * Get tank by tank number
   */
  async getTankByTankNumber(tankNumber: string): Promise<OxygenTank | null> {
    try {
      return await this.tankRepository.findOne({
        where: { tankNumber },
        relations: ['assignedUser', 'lastUpdatedByUser']
      });
    } catch (error) {
      logError('Failed to get tank by tank number:', error);
      throw new Error('Failed to retrieve tank');
    }
  }

  /**
   * Get all tanks with optional filters
   */
  async getAllTanks(filters?: {
    status?: TankStatus;
    type?: TankType;
    location?: string;
    assignedTo?: string;
  }): Promise<OxygenTank[]> {
    try {
      const query = this.tankRepository.createQueryBuilder('tank')
        .leftJoinAndSelect('tank.assignedUser', 'user')
        .leftJoinAndSelect('tank.lastUpdatedByUser', 'updatedBy');

      if (filters?.status) {
        query.andWhere('tank.status = :status', { status: filters.status });
      }

      if (filters?.type) {
        query.andWhere('tank.type = :type', { type: filters.type });
      }

      if (filters?.location) {
        query.andWhere('tank.location LIKE :location', { location: `%${filters.location}%` });
      }

      if (filters?.assignedTo) {
        query.andWhere('user.id = :assignedTo', { assignedTo: filters.assignedTo });
      }

      return await query.getMany();
    } catch (error) {
      logError('Failed to get all tanks:', error);
      throw new Error('Failed to retrieve tanks');
    }
  }

  /**
   * Update tank information
   */
  async updateTank(id: string, data: TankUpdateData): Promise<OxygenTank> {
    try {
      const tank = await this.getTankById(id);
      if (!tank) {
        throw new Error('Tank not found');
      }

      // Update fields
      Object.assign(tank, data);

      // Update capacity if changed
      if (data.capacity && data.capacity !== tank.capacity) {
        tank.capacity = data.capacity;
        // Recalculate fill percentage
        tank.fillPercentage = (tank.currentLevel / tank.capacity) * 100;
      }

      const updatedTank = await this.tankRepository.save(tank);
      info(`Oxygen tank updated: ${updatedTank.tankNumber}`);
      return updatedTank;
    } catch (error) {
      logError('Failed to update tank:', error);
      throw new Error('Failed to update tank');
    }
  }

  /**
   * Delete tank
   */
  async deleteTank(id: string): Promise<void> {
    try {
      const tank = await this.getTankById(id);
      if (!tank) {
        throw new Error('Tank not found');
      }

      await this.tankRepository.remove(tank);
      info(`Oxygen tank deleted: ${tank.tankNumber}`);
    } catch (error) {
      logError('Failed to delete tank:', error);
      throw new Error('Failed to delete tank');
    }
  }

  // =============================================================================
  // TANK MONITORING
  // =============================================================================

  /**
   * Update tank readings from sensors
   */
  async updateTankReadings(reading: TankReading): Promise<OxygenTank> {
    try {
      const tank = await this.getTankByTankNumber(reading.tankNumber);
      if (!tank) {
        throw new Error('Tank not found');
      }

      // Update tank readings using the entity method
      tank.updateReadings(
        reading.currentLevel,
        reading.currentPressure,
        reading.temperature,
        reading.humidity
      );

      tank.lastReadingAt = reading.timestamp;

      // Check for low level alerts
      await this.checkLowLevelAlert(tank);

      // Check for pressure alerts
      await this.checkPressureAlert(tank);

      // Check for temperature alerts
      await this.checkTemperatureAlert(tank);

      const updatedTank = await this.tankRepository.save(tank);
      return updatedTank;
    } catch (error) {
      logError('Failed to update tank readings:', error);
      throw new Error('Failed to update tank readings');
    }
  }

  /**
   * Check for low level alerts
   */
  private async checkLowLevelAlert(tank: OxygenTank): Promise<void> {
    const lowLevelThreshold = config.emergency.alertThreshold;
    
    if (tank.fillPercentage <= lowLevelThreshold) {
      // Check if alert already exists
      const existingAlert = await this.alertRepository.findOne({
        where: {
          tankId: tank.id,
          type: AlertType.TANK_LOW_LEVEL,
          status: AlertStatus.ACTIVE
        }
      });

      if (!existingAlert) {
        const alert = this.alertRepository.create({
          title: `Low Oxygen Level - Tank ${tank.tankNumber}`,
          message: `Oxygen tank ${tank.tankNumber} is running low (${tank.fillPercentage.toFixed(1)}%)`,
          type: AlertType.TANK_LOW_LEVEL,
          category: AlertCategory.TANK_MONITORING,
          severity: AlertSeverity.HIGH,
          status: AlertStatus.ACTIVE,
          tankId: tank.id,
          source: 'oxygen_tank_service',
          location: tank.location,
          metadata: {
            currentLevel: tank.currentLevel,
            capacity: tank.capacity,
            percentage: tank.fillPercentage
          },
          sensorData: {
            level: tank.currentLevel,
            timestamp: new Date()
          }
        });

        await this.alertRepository.save(alert);
        warn(`Low level alert created for tank: ${tank.tankNumber}`);
      }
    }
  }

  /**
   * Check for pressure alerts
   */
  private async checkPressureAlert(tank: OxygenTank): Promise<void> {
    if (tank.currentPressure < tank.minPressure || tank.currentPressure > tank.maxPressure) {
      const existingAlert = await this.alertRepository.findOne({
        where: {
          tankId: tank.id,
          type: tank.currentPressure < tank.minPressure ? AlertType.TANK_LOW_PRESSURE : AlertType.TANK_HIGH_PRESSURE,
          status: AlertStatus.ACTIVE
        }
      });

      if (!existingAlert) {
        const alertType = tank.currentPressure < tank.minPressure ? AlertType.TANK_LOW_PRESSURE : AlertType.TANK_HIGH_PRESSURE;
        const alert = this.alertRepository.create({
          title: `Pressure Anomaly - Tank ${tank.tankNumber}`,
          message: `Pressure anomaly detected in tank ${tank.tankNumber}: ${tank.currentPressure} ${tank.pressureUnit}`,
          type: alertType,
          category: AlertCategory.TANK_MONITORING,
          severity: tank.currentPressure < tank.minPressure ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          status: AlertStatus.ACTIVE,
          tankId: tank.id,
          source: 'oxygen_tank_service',
          location: tank.location,
          metadata: {
            pressure: tank.currentPressure,
            minPressure: tank.minPressure,
            maxPressure: tank.maxPressure,
            unit: tank.pressureUnit
          },
          sensorData: {
            pressure: tank.currentPressure,
            timestamp: new Date()
          }
        });

        await this.alertRepository.save(alert);
        warn(`Pressure alert created for tank: ${tank.tankNumber}`);
      }
    }
  }

  /**
   * Check for temperature alerts
   */
  private async checkTemperatureAlert(tank: OxygenTank): Promise<void> {
    if (tank.temperature !== null && tank.temperature !== undefined) {
      const minTemp = -20; // Celsius
      const maxTemp = 50; // Celsius

      if (tank.temperature < minTemp || tank.temperature > maxTemp) {
        const existingAlert = await this.alertRepository.findOne({
          where: {
            tankId: tank.id,
            type: AlertType.ENVIRONMENTAL_HAZARD,
            status: AlertStatus.ACTIVE
          }
        });

        if (!existingAlert) {
          const alert = this.alertRepository.create({
            title: `Temperature Anomaly - Tank ${tank.tankNumber}`,
            message: `Temperature anomaly detected in tank ${tank.tankNumber}: ${tank.temperature}°C`,
            type: AlertType.ENVIRONMENTAL_HAZARD,
            category: AlertCategory.SAFETY,
            severity: AlertSeverity.MEDIUM,
            status: AlertStatus.ACTIVE,
            tankId: tank.id,
            source: 'oxygen_tank_service',
            location: tank.location,
            metadata: {
              temperature: tank.temperature,
              minTemp,
              maxTemp
            },
            sensorData: {
              temperature: tank.temperature,
              timestamp: new Date()
            }
          });

          await this.alertRepository.save(alert);
          warn(`Temperature alert created for tank: ${tank.tankNumber}`);
        }
      }
    }
  }

  // =============================================================================
  // TANK OPERATIONS
  // =============================================================================

  /**
   * Assign tank to user
   */
  async assignTank(tankId: string, userId: string): Promise<OxygenTank> {
    try {
      const tank = await this.getTankById(tankId);
      if (!tank) {
        throw new Error('Tank not found');
      }

      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      if (!user) {
        throw new Error('User not found');
      }

      tank.assignedTo = user.id;
      tank.assignedUser = user;

      const updatedTank = await this.tankRepository.save(tank);
      info(`Tank ${tank.tankNumber} assigned to user: ${user.email}`);
      return updatedTank;
    } catch (error) {
      logError('Failed to assign tank:', error);
      throw new Error('Failed to assign tank');
    }
  }

  /**
   * Unassign tank from user
   */
  async unassignTank(tankId: string): Promise<OxygenTank> {
    try {
      const tank = await this.getTankById(tankId);
      if (!tank) {
        throw new Error('Tank not found');
      }

      tank.assignedTo = null as any;
      tank.assignedUser = null as any;

      const updatedTank = await this.tankRepository.save(tank);
      info(`Tank ${tank.tankNumber} unassigned`);
      return updatedTank;
    } catch (error) {
      logError('Failed to unassign tank:', error);
      throw new Error('Failed to unassign tank');
    }
  }

  /**
   * Schedule tank maintenance
   */
  async scheduleMaintenance(tankId: string, maintenanceDate: Date): Promise<OxygenTank> {
    try {
      const tank = await this.getTankById(tankId);
      if (!tank) {
        throw new Error('Tank not found');
      }

      tank.nextMaintenanceDate = maintenanceDate;
      tank.status = TankStatus.MAINTENANCE;

      const updatedTank = await this.tankRepository.save(tank);
      info(`Maintenance scheduled for tank ${tank.tankNumber}: ${maintenanceDate}`);
      return updatedTank;
    } catch (error) {
      logError('Failed to schedule maintenance:', error);
      throw new Error('Failed to schedule maintenance');
    }
  }

  /**
   * Complete tank maintenance
   */
  async completeMaintenance(tankId: string, notes?: string): Promise<OxygenTank> {
    try {
      const tank = await this.getTankById(tankId);
      if (!tank) {
        throw new Error('Tank not found');
      }

      tank.lastInspectionDate = new Date();
      tank.nextMaintenanceDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      tank.status = TankStatus.ACTIVE;
      tank.maintenanceNotes = notes || null;

      const updatedTank = await this.tankRepository.save(tank);
      info(`Maintenance completed for tank ${tank.tankNumber}`);
      return updatedTank;
    } catch (error) {
      logError('Failed to complete maintenance:', error);
      throw new Error('Failed to complete maintenance');
    }
  }

  // =============================================================================
  // ANALYTICS AND REPORTING
  // =============================================================================

  /**
   * Get tank statistics
   */
  async getTankStatistics(): Promise<{
    totalTanks: number;
    activeTanks: number;
    lowLevelTanks: number;
    maintenanceDue: number;
    averageLevel: number;
  }> {
    try {
      const totalTanks = await this.tankRepository.count();
      const activeTanks = await this.tankRepository.count({
        where: { status: TankStatus.ACTIVE }
      });

      const lowLevelTanks = await this.tankRepository.count({
        where: {
          fillPercentage: config.emergency.alertThreshold
        }
      });

      const maintenanceDue = await this.tankRepository.count({
        where: {
          nextMaintenanceDate: new Date()
        }
      });

      const result = await this.tankRepository
        .createQueryBuilder('tank')
        .select('AVG(tank.fillPercentage)', 'averageLevel')
        .getRawOne();

      const averageLevel = parseFloat(result.averageLevel) || 0;

      return {
        totalTanks,
        activeTanks,
        lowLevelTanks,
        maintenanceDue,
        averageLevel
      };
    } catch (error) {
      logError('Failed to get tank statistics:', error);
      throw new Error('Failed to get tank statistics');
    }
  }

  /**
   * Get tanks requiring attention
   */
  async getTanksRequiringAttention(): Promise<OxygenTank[]> {
    try {
      return await this.tankRepository.find({
        where: [
          { fillPercentage: config.emergency.alertThreshold },
          { status: TankStatus.MAINTENANCE },
          { status: TankStatus.INACTIVE }
        ],
        relations: ['assignedUser', 'lastUpdatedByUser']
      });
    } catch (error) {
      logError('Failed to get tanks requiring attention:', error);
      throw new Error('Failed to get tanks requiring attention');
    }
  }
} 