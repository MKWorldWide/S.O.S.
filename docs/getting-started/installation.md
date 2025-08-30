# Installation Guide

Welcome to the Sovereign Oxygen System (S.O.S.)! This guide will walk you through the installation process.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 20.x or later
- PostgreSQL 14 or later
- Redis 7 or later
- Python 3.11 or later (for certain components)
- npm 9.x or later

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/sovereign-oxygen-system.git
cd sovereign-oxygen-system
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Set Up Environment Variables

Copy the example environment file and update it with your configuration:

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials and other settings.

### 4. Set Up the Database

```bash
# Create and migrate the database
npm run db:migrate

# Seed the database with initial data (optional)
npm run db:seed
```

### 5. Start the Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:3000`.

## Production Deployment

### 1. Build the Application

```bash
npm run build
```

### 2. Start the Production Server

```bash
NODE_ENV=production npm start
```

## Docker Deployment

If you prefer using Docker, you can use the provided `docker-compose.yml`:

```bash
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure PostgreSQL and Redis are running
   - Verify your `.env` file has the correct credentials

2. **Missing Dependencies**
   - Run `npm ci` to ensure all dependencies are installed
   - Clear npm cache with `npm cache clean --force` if needed

3. **Port Conflicts**
   - Check if port 3000 is available or update the port in `.env`

## Next Steps

- [Configuration](./configuration.md) - Learn how to configure S.O.S.
- [First Steps](./first-steps.md) - Get started with S.O.S.
