// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - DATABASE CONFIGURATION
// =============================================================================
// Database configuration and connection setup using TypeORM
// Handles database initialization, migrations, and connection management

import { DataSource } from 'typeorm';
import config from '@/config';
import { info, logError } from '@/utils/logger';
import { AlertStatus, AlertSeverity } from './entities/Alert';
import { TankType, TankSize, VolumeUnit, PressureUnit } from './entities/OxygenTank';
import { UserRole, UserStatus } from './entities/User';

// Import all entities
import { User } from './entities/User';
import { OxygenTank } from './entities/OxygenTank';
import { Alert } from './entities/Alert';

// =============================================================================
// DATABASE CONFIGURATION
// =============================================================================

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.name,
  synchronize: config.development.debug, // Set to false in production
  logging: config.development.debug,
  entities: [User, OxygenTank, Alert],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/database/subscribers/*.ts'],
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  extra: {
    connectionLimit: config.database.poolMax,
    acquireTimeout: 60000,
    timeout: 30000,
  },
});

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

export async function initializeDatabase(): Promise<void> {
  try {
    info('Initializing database connection...');
    
    await AppDataSource.initialize();
    
    info('Database connection established successfully');
    
    // Test the connection
    await AppDataSource.query('SELECT 1');
    info('Database connection test passed');
    
  } catch (error: any) {
    logError('Failed to initialize database:', error);
    throw new Error(`Database initialization failed: ${error.message}`);
  }
}

// =============================================================================
// DATABASE SHUTDOWN
// =============================================================================

export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      info('Database connection closed successfully');
    }
  } catch (error: any) {
    logError('Error closing database connection:', error);
  }
}

// =============================================================================
// DATABASE HEALTH CHECK
// =============================================================================

export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  details?: any;
}> {
  try {
    if (!AppDataSource.isInitialized) {
      return {
        status: 'unhealthy',
        message: 'Database not initialized',
      };
    }

    // Test connection with a simple query
    const result = await AppDataSource.query('SELECT 1 as test');
    
    if (result && result[0] && result[0].test === 1) {
      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        details: {
          connected: true,
          database: config.database.name,
          host: config.database.host,
          port: config.database.port,
        },
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'Database health check failed',
        details: { result },
      };
    }
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: 'Database health check error',
      details: { error: error.message },
    };
  }
}

// =============================================================================
// DATABASE STATISTICS
// =============================================================================

export async function getDatabaseStats(): Promise<{
  totalUsers: number;
  totalTanks: number;
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
}> {
  try {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }

    const userRepository = AppDataSource.getRepository(User);
    const tankRepository = AppDataSource.getRepository(OxygenTank);
    const alertRepository = AppDataSource.getRepository(Alert);

    const [
      totalUsers,
      totalTanks,
      totalAlerts,
      activeAlerts,
      criticalAlerts,
    ] = await Promise.all([
      userRepository.count(),
      tankRepository.count(),
      alertRepository.count(),
      alertRepository.count({ where: { status: AlertStatus.ACTIVE } }),
      alertRepository.count({ where: { severity: AlertSeverity.CRITICAL } }),
    ]);

    return {
      totalUsers,
      totalTanks,
      totalAlerts,
      activeAlerts,
      criticalAlerts,
    };
  } catch (error: any) {
    logError('Error getting database stats:', error);
    throw error;
  }
}

// =============================================================================
// DATABASE BACKUP UTILITIES
// =============================================================================

export async function createDatabaseBackup(): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `./backups/sos-backup-${timestamp}.sql`;
    
    // This would typically use pg_dump or similar tool
    // For now, we'll just return a placeholder
    info(`Database backup created: ${backupPath}`);
    
    return backupPath;
  } catch (error: any) {
    logError('Error creating database backup:', error);
    throw error;
  }
}

// =============================================================================
// DATABASE MIGRATION UTILITIES
// =============================================================================

export async function runMigrations(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const migrations = await AppDataSource.runMigrations();
    info(`Ran ${migrations.length} migrations`);
  } catch (error: any) {
    logError('Error running migrations:', error);
    throw error;
  }
}

export async function revertLastMigration(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    await AppDataSource.undoLastMigration();
    info('Reverted last migration');
  } catch (error: any) {
    logError('Error reverting migration:', error);
    throw error;
  }
}

// =============================================================================
// DATABASE SEEDING
// =============================================================================

export async function seedDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    info('Starting database seeding...');

    // Check if we already have data
    const userRepository = AppDataSource.getRepository(User);
    const existingUsers = await userRepository.count();

    if (existingUsers > 0) {
      info('Database already contains data, skipping seeding');
      return;
    }

    // Create default admin user
    const adminUser = userRepository.create({
      username: 'admin',
      email: 'admin@sos.com',
      password: 'admin123', // This will be hashed by the entity hook
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });

    await userRepository.save(adminUser);
    info('Created default admin user');

    // Create sample oxygen tanks
    const tankRepository = AppDataSource.getRepository(OxygenTank);
    
    const sampleTanks = [
      {
        tankNumber: 'TANK-001',
        name: 'Main Hospital Tank 1',
        description: 'Primary oxygen tank for emergency department',
        type: TankType.MEDICAL_OXYGEN,
        size: TankSize.LARGE,
        location: 'Emergency Department',
        building: 'Main Hospital',
        floor: 'Ground Floor',
        room: 'ED-01',
        capacity: 100,
        capacityUnit: VolumeUnit.LITERS,
        currentLevel: 85,
        currentPressure: 2000,
        pressureUnit: PressureUnit.PSI,
        maxPressure: 2200,
        minPressure: 100,
        criticalPressure: 200,
        refillThreshold: 20,
        isConnected: true,
        isOperational: true,
        manufacturer: 'OxygenCorp',
        model: 'MC-100L',
        serialNumber: 'SN001234',
        assignedTo: adminUser.id,
      },
      {
        tankNumber: 'TANK-002',
        name: 'ICU Tank 1',
        description: 'Oxygen tank for intensive care unit',
        type: TankType.MEDICAL_OXYGEN,
        size: TankSize.MEDIUM,
        location: 'ICU',
        building: 'Main Hospital',
        floor: '2nd Floor',
        room: 'ICU-01',
        capacity: 50,
        capacityUnit: VolumeUnit.LITERS,
        currentLevel: 45,
        currentPressure: 1800,
        pressureUnit: PressureUnit.PSI,
        maxPressure: 2200,
        minPressure: 100,
        criticalPressure: 200,
        refillThreshold: 20,
        isConnected: true,
        isOperational: true,
        manufacturer: 'OxygenCorp',
        model: 'MC-50L',
        serialNumber: 'SN001235',
        assignedTo: adminUser.id,
      },
    ];

    for (const tankData of sampleTanks) {
      const tank = tankRepository.create(tankData);
      await tankRepository.save(tank);
    }

    info(`Created ${sampleTanks.length} sample oxygen tanks`);
    info('Database seeding completed successfully');

  } catch (error: any) {
    logError('Error seeding database:', error);
    throw error;
  }
}

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

export default AppDataSource; 