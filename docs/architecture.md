# 🏗️ S.O.S. System Architecture

## 📋 Overview

The **Sovereign Oxygen System (S.O.S.)** is designed as a comprehensive, decentralized oxygen management and monitoring platform. This document outlines the system architecture, technical decisions, and design patterns used throughout the application.

## 🎯 Architecture Principles

### 1. **Modularity**
- Clear separation of concerns between different system components
- Loose coupling and high cohesion
- Reusable and maintainable code modules

### 2. **Scalability**
- Horizontal scaling capabilities
- Microservices-ready architecture
- Efficient resource utilization

### 3. **Reliability**
- Fault-tolerant design
- Redundant systems and failover mechanisms
- Comprehensive error handling and logging

### 4. **Security**
- Defense in depth approach
- Secure by design principles
- Comprehensive authentication and authorization

### 5. **Real-time Capabilities**
- Low-latency data processing
- Real-time communication protocols
- Event-driven architecture

## 🏛️ System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (TypeScript)                                   │
│  ├── Dashboard Components                                      │
│  ├── Device Management                                         │
│  ├── Alert System                                              │
│  └── User Interface                                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Express.js Server (Node.js/TypeScript)                        │
│  ├── Authentication & Authorization                            │
│  ├── Rate Limiting                                             │
│  ├── Request Validation                                        │
│  └── Error Handling                                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Internal Communication
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer                                                 │
│  ├── User Management Service                                   │
│  ├── Device Management Service                                 │
│  ├── Sensor Data Service                                       │
│  ├── Alert Management Service                                  │
│  ├── Emergency Response Service                                │
│  └── Analytics Service                                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Data Access
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                           │
│  ├── User Data                                                 │
│  ├── Device Information                                        │
│  ├── Sensor Readings                                           │
│  ├── Alert History                                             │
│  └── System Logs                                               │
│                                                                │
│  Redis Cache                                                   │
│  ├── Session Storage                                           │
│  ├── Real-time Data                                            │
│  └── Rate Limiting                                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ IoT Communication
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      IOT LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  MQTT Broker                                                   │
│  ├── Sensor Data Collection                                    │
│  ├── Device Commands                                           │
│  ├── Real-time Monitoring                                      │
│  └── Emergency Alerts                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **State Management**: React Hooks + Context API
- **Routing**: React Router v6
- **Real-time**: Socket.io Client

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT with refresh tokens
- **Validation**: Joi
- **Rate Limiting**: express-rate-limit
- **Security**: Helmet, CORS, bcryptjs

### Database
- **Primary**: PostgreSQL 14+
- **ORM**: Knex.js
- **Migrations**: Knex migrations
- **Caching**: Redis

### Real-time Communication
- **WebSocket**: Socket.io
- **IoT Protocol**: MQTT
- **Message Broker**: Mosquitto (recommended)

### Development Tools
- **Package Manager**: npm
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint + Prettier
- **Testing**: Jest + Supertest
- **Git Hooks**: Husky

## 📁 Project Structure

```
S.O.S./
├── 📁 src/
│   ├── 📁 client/              # React frontend
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Main app component
│   │   └── index.css          # Global styles
│   ├── 📁 server/              # Express.js backend
│   │   └── index.ts           # Server entry point
│   ├── 📁 api/                 # API routes and controllers
│   │   ├── 📁 routes/         # Route definitions
│   │   ├── 📁 controllers/    # Request handlers
│   │   ├── 📁 middleware/     # Custom middleware
│   │   └── 📁 validators/     # Request validation
│   ├── 📁 components/          # React components
│   │   ├── 📁 layout/         # Layout components
│   │   ├── 📁 pages/          # Page components
│   │   ├── 📁 common/         # Reusable components
│   │   └── 📁 forms/          # Form components
│   ├── 📁 services/            # Business logic services
│   │   ├── authService.ts     # Authentication service
│   │   ├── deviceService.ts   # Device management
│   │   ├── sensorService.ts   # Sensor data processing
│   │   ├── alertService.ts    # Alert management
│   │   ├── mqttService.ts     # MQTT communication
│   │   └── redisService.ts    # Redis operations
│   ├── 📁 database/            # Database configuration
│   │   ├── connection.ts      # Database connection
│   │   ├── knexfile.ts        # Knex configuration
│   │   ├── 📁 migrations/     # Database migrations
│   │   └── 📁 seeds/          # Seed data
│   ├── 📁 utils/               # Utility functions
│   │   ├── logger.ts          # Logging utility
│   │   ├── errorHandler.ts    # Error handling
│   │   ├── rateLimiter.ts     # Rate limiting
│   │   └── validators.ts      # Validation utilities
│   ├── 📁 types/               # TypeScript type definitions
│   │   └── index.ts           # Main types file
│   ├── 📁 config/              # Configuration files
│   │   └── index.ts           # Main configuration
│   └── 📁 hooks/               # React custom hooks
│       ├── useAuth.ts         # Authentication hook
│       ├── useWebSocket.ts    # WebSocket hook
│       └── useAlerts.ts       # Alerts hook
├── 📁 docs/                    # Documentation
│   ├── README.md              # Main documentation
│   ├── architecture.md        # This file
│   ├── api.md                 # API documentation
│   ├── deployment.md          # Deployment guide
│   ├── memories.md            # Development memories
│   ├── lessons-learned.md     # Lessons learned
│   └── scratchpad.md          # Development notes
├── 📁 tests/                   # Test files
│   ├── 📁 unit/               # Unit tests
│   ├── 📁 integration/        # Integration tests
│   └── 📁 e2e/                # End-to-end tests
├── 📁 public/                  # Static assets
├── 📁 scripts/                 # Build and deployment scripts
└── 📁 logs/                    # Application logs
```

## 🔄 Data Flow

### 1. **Sensor Data Flow**
```
IoT Device → MQTT Broker → MQTT Service → Sensor Service → Database
                                    ↓
                              Real-time Updates → WebSocket → Frontend
```

### 2. **User Authentication Flow**
```
Frontend → API Gateway → Auth Service → Database
                    ↓
              JWT Token → Frontend Storage
```

### 3. **Alert Processing Flow**
```
Sensor Data → Alert Service → Alert Rules → Alert Generation
                    ↓
              Notification Service → Email/SMS → User
                    ↓
              Real-time Update → WebSocket → Frontend
```

### 4. **Emergency Response Flow**
```
Critical Alert → Emergency Service → Backup System Activation
                    ↓
              Emergency Shutdown → Device Control → MQTT Commands
                    ↓
              Emergency Notifications → Multiple Channels
```

## 🔒 Security Architecture

### 1. **Authentication & Authorization**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Session management with Redis
- Multi-factor authentication support

### 2. **Data Protection**
- Encryption at rest for sensitive data
- TLS/SSL for all communications
- Input validation and sanitization
- SQL injection prevention

### 3. **API Security**
- Rate limiting to prevent abuse
- CORS configuration
- Security headers (Helmet)
- Request validation

### 4. **IoT Security**
- MQTT authentication and authorization
- Encrypted MQTT communications (MQTTS)
- Device certificate management
- Message validation

## 📊 Performance Considerations

### 1. **Database Optimization**
- Connection pooling
- Query optimization
- Indexing strategies for time-series data
- Read replicas for scaling

### 2. **Caching Strategy**
- Redis for session storage
- Real-time data caching
- API response caching
- Static asset caching

### 3. **Real-time Performance**
- WebSocket connection pooling
- MQTT QoS levels optimization
- Message batching
- Efficient event handling

### 4. **Frontend Optimization**
- Code splitting and lazy loading
- Bundle optimization
- Image optimization
- Service worker for caching

## 🔄 Deployment Architecture

### Development Environment
- Local PostgreSQL database
- Local Redis instance
- MQTT broker (Mosquitto)
- Hot reload for both frontend and backend

### Production Environment
- Containerized deployment (Docker)
- Load balancing (Nginx)
- Database clustering
- Redis clustering
- MQTT broker clustering
- CDN for static assets

### Monitoring & Observability
- Application logging (Winston)
- Performance monitoring
- Error tracking
- Health checks
- Metrics collection

## 🚀 Scalability Strategy

### 1. **Horizontal Scaling**
- Stateless application design
- Database read replicas
- Redis clustering
- Load balancer configuration

### 2. **Microservices Migration Path**
- Service-oriented architecture
- API gateway pattern
- Event-driven communication
- Independent deployment

### 3. **Data Partitioning**
- Time-based partitioning for sensor data
- Geographic partitioning for devices
- User-based partitioning for personal data

## 🔧 Configuration Management

### Environment Variables
- Centralized configuration management
- Environment-specific settings
- Secure secret management
- Configuration validation

### Feature Flags
- Feature toggle system
- A/B testing support
- Gradual rollout capabilities
- Emergency feature disable

## 📈 Future Enhancements

### 1. **Machine Learning Integration**
- Predictive maintenance
- Anomaly detection
- Usage pattern analysis
- Optimization recommendations

### 2. **Advanced Analytics**
- Real-time dashboards
- Historical trend analysis
- Performance metrics
- Custom reporting

### 3. **Mobile Applications**
- Native iOS/Android apps
- Offline capabilities
- Push notifications
- Mobile-specific features

### 4. **Integration Capabilities**
- Third-party system integration
- API marketplace
- Webhook support
- Standard protocol support

---

*This architecture document will be updated as the system evolves and new requirements are identified.* 