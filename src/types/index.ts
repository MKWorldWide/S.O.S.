// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - TYPE DEFINITIONS
// =============================================================================
// This file contains all TypeScript type definitions for the S.O.S. system
// These types ensure type safety across the entire application

// =============================================================================
// USER MANAGEMENT TYPES
// =============================================================================

/**
 * User roles for role-based access control (RBAC)
 */
export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  TECHNICIAN = 'technician',
  VIEWER = 'viewer',
}

/**
 * User interface representing a system user
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User creation request payload
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/**
 * User update request payload
 */
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

/**
 * Authentication response with JWT tokens
 */
export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

// =============================================================================
// DEVICE & SENSOR TYPES
// =============================================================================

/**
 * Device types supported by the system
 */
export enum DeviceType {
  OXYGEN_TANK = 'oxygen_tank',
  OXYGEN_GENERATOR = 'oxygen_generator',
  PIPELINE_VALVE = 'pipeline_valve',
  PRESSURE_REGULATOR = 'pressure_regulator',
  FLOW_METER = 'flow_meter',
  TEMPERATURE_SENSOR = 'temperature_sensor',
  HUMIDITY_SENSOR = 'humidity_sensor',
}

/**
 * Device status enumeration
 */
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  EMERGENCY = 'emergency',
}

/**
 * Device interface representing a physical device in the system
 */
export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  location: string;
  status: DeviceStatus;
  lastSeen: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sensor types for different measurements
 */
export enum SensorType {
  OXYGEN_LEVEL = 'oxygen_level',
  PRESSURE = 'pressure',
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  FLOW_RATE = 'flow_rate',
  TANK_LEVEL = 'tank_level',
}

/**
 * Sensor reading interface for time-series data
 */
export interface SensorReading {
  id: string;
  deviceId: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  timestamp: Date;
  quality: 'good' | 'uncertain' | 'bad';
  metadata?: Record<string, any>;
}

/**
 * Device creation request payload
 */
export interface CreateDeviceRequest {
  name: string;
  type: DeviceType;
  location: string;
  metadata?: Record<string, any>;
}

/**
 * Device update request payload
 */
export interface UpdateDeviceRequest {
  name?: string;
  location?: string;
  status?: DeviceStatus;
  metadata?: Record<string, any>;
}

// =============================================================================
// ALERT & NOTIFICATION TYPES
// =============================================================================

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

/**
 * Alert status enumeration
 */
export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

/**
 * Alert types for different system events
 */
export enum AlertType {
  LOW_OXYGEN_LEVEL = 'low_oxygen_level',
  HIGH_PRESSURE = 'high_pressure',
  LOW_PRESSURE = 'low_pressure',
  TEMPERATURE_ANOMALY = 'temperature_anomaly',
  DEVICE_OFFLINE = 'device_offline',
  MAINTENANCE_DUE = 'maintenance_due',
  SYSTEM_ERROR = 'system_error',
  EMERGENCY_SHUTDOWN = 'emergency_shutdown',
}

/**
 * Alert interface representing a system alert
 */
export interface Alert {
  id: string;
  deviceId?: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Alert creation request payload
 */
export interface CreateAlertRequest {
  deviceId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
}

/**
 * Alert update request payload
 */
export interface UpdateAlertRequest {
  status?: AlertStatus;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

// =============================================================================
// MQTT & REAL-TIME COMMUNICATION TYPES
// =============================================================================

/**
 * MQTT message interface for sensor data
 */
export interface MqttMessage {
  topic: string;
  payload: string;
  qos: number;
  retain: boolean;
  timestamp: Date;
}

/**
 * Sensor data payload structure
 */
export interface SensorDataPayload {
  deviceId: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  timestamp: string;
  quality?: 'good' | 'uncertain' | 'bad';
  metadata?: Record<string, any>;
}

/**
 * Command payload for device control
 */
export interface DeviceCommand {
  deviceId: string;
  command: string;
  parameters?: Record<string, any>;
  timestamp: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  timestamp: Date;
  code?: string;
  details?: Record<string, any>;
}

// =============================================================================
// DASHBOARD & ANALYTICS TYPES
// =============================================================================

/**
 * Dashboard widget types
 */
export enum WidgetType {
  GAUGE = 'gauge',
  CHART = 'chart',
  TABLE = 'table',
  STATUS = 'status',
  ALERT = 'alert',
  METRIC = 'metric',
}

/**
 * Dashboard widget interface
 */
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Dashboard interface
 */
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Time range for analytics queries
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Analytics query parameters
 */
export interface AnalyticsQuery {
  deviceIds?: string[];
  sensorTypes?: SensorType[];
  timeRange: TimeRange;
  aggregation?: 'min' | 'max' | 'avg' | 'sum' | 'count';
  interval?: string; // e.g., '1h', '1d', '1w'
}

// =============================================================================
// SYSTEM CONFIGURATION TYPES
// =============================================================================

/**
 * System configuration interface
 */
export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description?: string;
  isPublic: boolean;
  updatedBy: string;
  updatedAt: Date;
}

/**
 * Emergency response configuration
 */
export interface EmergencyConfig {
  alertThreshold: number;
  responseTimeout: number;
  autoShutdownEnabled: boolean;
  backupSystemEnabled: boolean;
  escalationLevels: number;
  notificationChannels: string[];
}

// =============================================================================
// AUDIT & LOGGING TYPES
// =============================================================================

/**
 * Audit log entry interface
 */
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * System log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

/**
 * System log entry interface
 */
export interface SystemLog {
  id: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Generic key-value pair
 */
export interface KeyValuePair<T = any> {
  key: string;
  value: T;
}

/**
 * Generic pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Generic filter parameters
 */
export interface FilterParams {
  search?: string;
  filters?: Record<string, any>;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

/**
 * Generic query parameters combining pagination and filters
 */
export interface QueryParams extends PaginationParams, FilterParams {} 