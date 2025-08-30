# First Steps with S.O.S.

Welcome to the Sovereign Oxygen System (S.O.S.)! This guide will help you get started with the basic features and functionality.

## Accessing the Dashboard

1. Open your web browser and navigate to `http://localhost:3000` (or your configured domain)
2. Log in with your credentials (default admin credentials if first run)
   - Username: `admin@example.com`
   - Password: `admin123` (change this immediately after first login)

## System Overview

The S.O.S. dashboard provides an overview of your oxygen monitoring system:

- **Real-time Monitoring**: View current oxygen levels and system status
- **Alerts**: See active alerts and notifications
- **Reports**: Access historical data and generate reports
- **Settings**: Configure system parameters and user accounts

## Your First Steps

### 1. Change the Default Password

1. Click on your profile picture in the top-right corner
2. Select "Account Settings"
3. Click "Change Password"
4. Enter your current password and set a new, strong password
5. Click "Save Changes"

### 2. Add a New User

1. Navigate to "Settings" > "Users"
2. Click "Add New User"
3. Fill in the user details:
   - Full Name
   - Email Address
   - Role (Admin, Operator, Viewer)
   - Temporary Password
4. Click "Create User"

The new user will receive an email with instructions to set their password.

### 3. Configure Your First Oxygen Sensor

1. Go to "Devices" > "Sensors"
2. Click "Add Sensor"
3. Enter the sensor details:
   - Sensor ID (from the physical device)
   - Location (e.g., "Main Ward A")
   - Alert Thresholds (warning and critical levels)
   - Update Frequency
4. Click "Save"

### 4. Set Up Alerts

1. Navigate to "Alerts" > "Alert Rules"
2. Click "Create Rule"
3. Configure the alert:
   - Name (e.g., "Low Oxygen Level")
   - Condition (e.g., "Oxygen Level < 90%")
   - Severity (Warning, Critical, Emergency)
   - Notification Method (Email, SMS, In-app)
   - Recipients
4. Click "Save Rule"

## Basic Navigation

### Dashboard
- **Overview**: System status at a glance
- **Alerts**: Active and historical alerts
- **Reports**: Generate and view reports
- **Devices**: Manage sensors and equipment
- **Settings**: System configuration

## Common Tasks

### Viewing Oxygen Levels
1. Go to the Dashboard
2. View the real-time oxygen level gauge
3. Hover over the graph to see historical data

### Acknowledging Alerts
1. Click on the bell icon in the top navigation
2. Click on an alert to view details
3. Click "Acknowledge" to mark as read

### Generating Reports
1. Go to "Reports"
2. Select the report type (Daily, Weekly, Monthly)
3. Choose a date range
4. Click "Generate Report"
5. Export as PDF or CSV if needed

## Troubleshooting

### I can't log in
- Verify your username and password
- Check if CAPS LOCK is on
- Contact your system administrator if you're locked out

### Sensor not updating
- Check the device connection
- Verify the sensor is powered on
- Check network connectivity

### Alerts not working
- Verify alert rules are properly configured
- Check notification settings
- Ensure email/SMS services are properly configured

## Getting Help

- **Documentation**: Visit our [documentation](https://your-org.github.io/sovereign-oxygen-system/)
- **Support**: Email support@example.com
- **Community**: Join our [community forum](https://community.example.com)

## Next Steps

- Explore the [User Guide](../user-guide/dashboard.md) for more detailed information
- Check out the [API Reference](../api/endpoints.md) for integration options
- Learn about [advanced configuration](../getting-started/configuration.md)
