// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - CONFIGURATION
// =============================================================================
// Centralized configuration management for the S.O.S. system
// This file handles all environment variables, validation, and configuration

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// =============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// =============================================================================

/**
 * Validates required environment variables
 * @throws Error if required environment variables are missing
 */
function validateEnvironment(): void {
  const requiredVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// =============================================================================
// CONFIGURATION INTERFACES
// =============================================================================

interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  apiVersion: string;
  corsOrigin: string;
}

interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
  poolMin: number;
  poolMax: number;
}

interface RedisConfig {
  url: string;
  host: string;
  port: number;
  password?: string | undefined;
  db: number;
}

interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

interface MQTTConfig {
  brokerUrl: string;
  username: string;
  password: string;
  clientId: string;
  topicPrefix: string;
  qos: number;
  retain: boolean;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

interface SMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  enabled: boolean;
}

interface UploadConfig {
  directory: string;
  maxFileSize: number;
  allowedTypes: string[];
}

interface LoggingConfig {
  level: string;
  file: string;
  maxSize: string;
  maxFiles: number;
}

interface SecurityConfig {
  bcryptRounds: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  sessionSecret: string;
  cookieSecret: string;
}

interface MonitoringConfig {
  enableMetrics: boolean;
  metricsPort: number;
  healthCheckInterval: number;
  systemMonitoringEnabled: boolean;
}

interface EmergencyConfig {
  alertThreshold: number;
  responseTimeout: number;
  autoShutdownEnabled: boolean;
  backupSystemEnabled: boolean;
}

interface ExternalConfig {
  weatherApiKey: string;
  weatherApiUrl: string;
  externalMonitoringEnabled: boolean;
}

interface DevelopmentConfig {
  debug: boolean;
  testDatabaseUrl: string;
  mockSensorsEnabled: boolean;
  simulationMode: boolean;
}

interface ProductionConfig {
  sslEnabled: boolean;
  sslKeyPath: string;
  sslCertPath: string;
  clusterMode: boolean;
  workerProcesses: number;
}

interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JWTConfig;
  mqtt: MQTTConfig;
  email: EmailConfig;
  sms: SMSConfig;
  upload: UploadConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
  emergency: EmergencyConfig;
  external: ExternalConfig;
  development: DevelopmentConfig;
  production: ProductionConfig;
}

// =============================================================================
// CONFIGURATION OBJECT
// =============================================================================

const config: AppConfig = {
  server: {
    port: parseInt(process.env['PORT'] || '3000', 10),
    host: process.env['HOST'] || 'localhost',
    nodeEnv: process.env['NODE_ENV'] || 'development',
    apiVersion: process.env['API_VERSION'] || 'v1',
    corsOrigin: process.env['CORS_ORIGIN'] || 'http://localhost:3001',
  },
  database: {
    url: process.env['DATABASE_URL']!,
    host: process.env['DATABASE_HOST'] || 'localhost',
    port: parseInt(process.env['DATABASE_PORT'] || '5432', 10),
    name: process.env['DATABASE_NAME'] || 'sos_db',
    user: process.env['DATABASE_USER'] || 'username',
    password: process.env['DATABASE_PASSWORD'] || 'password',
    ssl: process.env['DATABASE_SSL'] === 'true',
    poolMin: parseInt(process.env['DATABASE_POOL_MIN'] || '2', 10),
    poolMax: parseInt(process.env['DATABASE_POOL_MAX'] || '10', 10),
  },
  redis: {
    url: process.env['REDIS_URL'] || 'redis://localhost:6379',
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'] || undefined,
    db: parseInt(process.env['REDIS_DB'] || '0', 10),
  },
  jwt: {
    secret: process.env['JWT_SECRET']!,
    expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
    refreshSecret: process.env['JWT_REFRESH_SECRET']!,
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  },
  mqtt: {
    brokerUrl: process.env['MQTT_BROKER_URL'] || 'mqtt://localhost:1883',
    username: process.env['MQTT_USERNAME'] || '',
    password: process.env['MQTT_PASSWORD'] || '',
    clientId: process.env['MQTT_CLIENT_ID'] || 'sos_system_client',
    topicPrefix: process.env['MQTT_TOPIC_PREFIX'] || 'sos/sensors/',
    qos: parseInt(process.env['MQTT_QOS'] || '1', 10),
    retain: process.env['MQTT_RETAIN'] === 'true',
  },
  email: {
    host: process.env['EMAIL_HOST'] || 'smtp.gmail.com',
    port: parseInt(process.env['EMAIL_PORT'] || '587', 10),
    secure: process.env['EMAIL_SECURE'] === 'true',
    user: process.env['EMAIL_USER'] || '',
    password: process.env['EMAIL_PASSWORD'] || '',
    from: process.env['EMAIL_FROM'] || 'SOS System <noreply@sos-system.com>',
  },
  sms: {
    accountSid: process.env['TWILIO_ACCOUNT_SID'] || '',
    authToken: process.env['TWILIO_AUTH_TOKEN'] || '',
    phoneNumber: process.env['TWILIO_PHONE_NUMBER'] || '',
    enabled: process.env['SMS_ENABLED'] === 'true',
  },
  upload: {
    directory: process.env['UPLOAD_DIR'] || 'uploads',
    maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10),
    allowedTypes: process.env['ALLOWED_FILE_TYPES']?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
    ],
  },
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
    file: process.env['LOG_FILE'] || 'logs/sos-system.log',
    maxSize: process.env['LOG_MAX_SIZE'] || '20m',
    maxFiles: parseInt(process.env['LOG_MAX_FILES'] || '14', 10),
  },
  security: {
    bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10),
    rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),
    sessionSecret: process.env['SESSION_SECRET'] || 'your-session-secret',
    cookieSecret: process.env['COOKIE_SECRET'] || 'your-cookie-secret',
  },
  monitoring: {
    enableMetrics: process.env['ENABLE_METRICS'] === 'true',
    metricsPort: parseInt(process.env['METRICS_PORT'] || '9090', 10),
    healthCheckInterval: parseInt(process.env['HEALTH_CHECK_INTERVAL'] || '30000', 10),
    systemMonitoringEnabled: process.env['SYSTEM_MONITORING_ENABLED'] === 'true',
  },
  emergency: {
    alertThreshold: parseFloat(process.env['EMERGENCY_ALERT_THRESHOLD'] || '0.15'),
    responseTimeout: parseInt(process.env['EMERGENCY_RESPONSE_TIMEOUT'] || '30000', 10),
    autoShutdownEnabled: process.env['AUTO_SHUTDOWN_ENABLED'] === 'true',
    backupSystemEnabled: process.env['BACKUP_OXYGEN_SYSTEM_ENABLED'] === 'true',
  },
  external: {
    weatherApiKey: process.env['WEATHER_API_KEY'] || '',
    weatherApiUrl: process.env['WEATHER_API_URL'] || 'https://api.openweathermap.org/data/2.5',
    externalMonitoringEnabled: process.env['EXTERNAL_MONITORING_ENABLED'] === 'true',
  },
  development: {
    debug: process.env['DEBUG'] === 'true',
    testDatabaseUrl: process.env['TEST_DATABASE_URL'] || '',
    mockSensorsEnabled: process.env['MOCK_SENSORS_ENABLED'] === 'true',
    simulationMode: process.env['SIMULATION_MODE'] === 'true',
  },
  production: {
    sslEnabled: process.env['SSL_ENABLED'] === 'true',
    sslKeyPath: process.env['SSL_KEY_PATH'] || '',
    sslCertPath: process.env['SSL_CERT_PATH'] || '',
    clusterMode: process.env['CLUSTER_MODE'] === 'true',
    workerProcesses: parseInt(process.env['WORKER_PROCESSES'] || '4', 10),
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks if the current environment is development
 * @returns boolean indicating if in development mode
 */
export function isDevelopment(): boolean {
  return config.server.nodeEnv === 'development';
}

/**
 * Checks if the current environment is production
 * @returns boolean indicating if in production mode
 */
export function isProduction(): boolean {
  return config.server.nodeEnv === 'production';
}

/**
 * Checks if the current environment is test
 * @returns boolean indicating if in test mode
 */
export function isTest(): boolean {
  return config.server.nodeEnv === 'test';
}

/**
 * Gets the appropriate configuration based on environment
 * @returns configuration object for current environment
 */
export function getEnvironmentConfig() {
  if (isDevelopment()) {
    return {
      ...config,
      development: config.development,
    };
  }
  
  if (isProduction()) {
    return {
      ...config,
      production: config.production,
    };
  }
  
  return config;
}

// =============================================================================
// VALIDATION AND EXPORT
// =============================================================================

// Validate environment variables on module load
validateEnvironment();

// Export the configuration object
export default config;

// Export individual configurations for convenience
export {
  type ServerConfig,
  type DatabaseConfig,
  type RedisConfig,
  type JWTConfig,
  type MQTTConfig,
  type EmailConfig,
  type SMSConfig,
  type UploadConfig,
  type LoggingConfig,
  type SecurityConfig,
  type MonitoringConfig,
  type EmergencyConfig,
  type ExternalConfig,
  type DevelopmentConfig,
  type ProductionConfig,
  type AppConfig,
}; 