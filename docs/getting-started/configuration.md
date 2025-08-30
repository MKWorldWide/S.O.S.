# Configuration Guide

This guide explains how to configure the Sovereign Oxygen System (S.O.S.) to suit your needs.

## Environment Variables

S.O.S. uses environment variables for configuration. Copy `.env.example` to `.env` and update the values as needed.

### Required Settings

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sos_db
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=90d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
SMTP_FROM=S.O.S. <noreply@example.com>
```

### Optional Settings

```env
# Logging
LOG_LEVEL=info  # error, warn, info, debug
LOG_TO_FILE=true
LOG_FILE_PATH=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS

# File Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880  # 5MB
```

## Database Configuration

### PostgreSQL Setup

1. Install PostgreSQL 14+ if not already installed
2. Create a new database and user:

```sql
CREATE DATABASE sos_db;
CREATE USER sos_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sos_db TO sos_user;
\c sos_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Redis Setup

1. Install Redis 7+ if not already installed
2. Update Redis configuration in `redis.conf` if needed:

```ini
bind 127.0.0.1
port 6379
timeout 300
databases 16
```

## Security Configuration

### JWT Tokens

- Use a strong, random string for `JWT_SECRET`
- Adjust token expiration times based on your security requirements

### Rate Limiting

Configure rate limiting in `src/config/rateLimit.ts`:

```typescript
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
};
```

## Email Configuration

Update the SMTP settings in `.env` to match your email provider. For Gmail, you might use:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
```

> **Note**: For Gmail, you may need to generate an App Password if you have 2FA enabled.

## Environment-Specific Configuration

### Development

```env
NODE_ENV=development
DEBUG=app:*,api:*,db:*
```

### Production

```env
NODE_ENV=production
LOG_LEVEL=warn
NODE_OPTIONS=--max-old-space-size=2048
```

## Verifying Configuration

To verify your configuration, run:

```bash
npm run check:config
```

This will validate your environment variables and configuration files.

## Next Steps

- [First Steps](./first-steps.md) - Get started with S.O.S.
- [API Reference](../api/endpoints.md) - Explore the API endpoints
