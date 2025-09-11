# MySQL Database Setup Guide

## Prerequisites

1. **Install MySQL Server:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server

   # macOS with Homebrew
   brew install mysql

   # Windows
   # Download and install from https://dev.mysql.com/downloads/mysql/
   ```

2. **Start MySQL Service:**
   ```bash
   # Ubuntu/Debian
   sudo systemctl start mysql
   sudo systemctl enable mysql

   # macOS
   brew services start mysql

   # Windows
   # MySQL should start automatically after installation
   ```

## Database Setup

1. **Log into MySQL as root:**
   ```bash
   sudo mysql
   # or
   mysql -u root -p
   ```

2. **Create the database:**
   ```sql
   CREATE DATABASE loan_app;
   ```

3. **Create a user (optional but recommended):**
   ```sql
   CREATE USER 'loan_app_user'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON loan_app.* TO 'loan_app_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Exit MySQL:**
   ```sql
   EXIT;
   ```

## Environment Configuration

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the .env file with your MySQL credentials:**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=loan_app
   DB_USER=loan_app_user
   DB_PASSWORD=secure_password
   ```

## Starting the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

The application will automatically create the necessary tables when it starts for the first time.

## Database Tables

The following tables will be created automatically by Sequelize:

- **Users**: Store user information including customers, loan officers, and admins
- **LoanProducts**: Store loan product configurations
- **LoanApplications**: Store loan application data
- **Loans**: Store active loan information

## Migration from MongoDB

If you're migrating from MongoDB, you'll need to:

1. Export your MongoDB data
2. Transform the data to match the new MySQL schema
3. Import the transformed data into MySQL

Contact your development team for assistance with data migration scripts.