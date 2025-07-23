#!/bin/bash

# MongoDB to MySQL Migration Script
# This script helps you run the migration with different database configurations

set -e  # Exit on any error

echo "🚀 MongoDB to MySQL Migration Script"
echo "====================================="

# Function to run migration with local MySQL
run_local_migration() {
    echo "📋 Running migration with local MySQL..."
    
    # Check if MySQL is running locally
    if ! mysql -u root -p -e "SELECT 1;" > /dev/null 2>&1; then
        echo "❌ Local MySQL connection failed. Please ensure MySQL is running and accessible."
        echo "   You can start MySQL with: brew services start mysql"
        exit 1
    fi
    
    # Create database if it doesn't exist
    echo "📦 Creating database if it doesn't exist..."
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS scholarship_server;"
    
    # Run schema
    echo "🏗️  Creating database schema..."
    mysql -u root -p scholarship_server < database/schema.sql
    
    # Run migration
    echo "🔄 Running data migration..."
    mysql -u root -p scholarship_server < scripts/mongodb-to-mysql-converter.sql
    
    echo "✅ Local migration completed successfully!"
}

# Function to run migration with AWS RDS
run_aws_migration() {
    echo "📋 Running migration with AWS RDS..."
    
    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        echo "❌ AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    echo "🔐 Please provide your AWS RDS database credentials:"
    read -p "Database Host: " DB_HOST
    read -p "Database Name: " DB_NAME
    read -p "Database User: " DB_USER
    read -s -p "Database Password: " DB_PASSWORD
    echo
    
    # Test connection
    echo "🔍 Testing database connection..."
    if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
        echo "❌ Database connection failed. Please check your credentials."
        exit 1
    fi
    
    # Run schema
    echo "🏗️  Creating database schema..."
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/schema.sql
    
    # Run migration
    echo "🔄 Running data migration..."
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < scripts/mongodb-to-mysql-converter.sql
    
    echo "✅ AWS migration completed successfully!"
}

# Function to run migration with custom connection
run_custom_migration() {
    echo "📋 Running migration with custom MySQL connection..."
    
    read -p "Database Host (default: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "Database Port (default: 3306): " DB_PORT
    DB_PORT=${DB_PORT:-3306}
    
    read -p "Database Name: " DB_NAME
    read -p "Database User: " DB_USER
    read -s -p "Database Password: " DB_PASSWORD
    echo
    
    # Test connection
    echo "🔍 Testing database connection..."
    if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
        echo "❌ Database connection failed. Please check your credentials."
        exit 1
    fi
    
    # Run schema
    echo "🏗️  Creating database schema..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/schema.sql
    
    # Run migration
    echo "🔄 Running data migration..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < scripts/mongodb-to-mysql-converter.sql
    
    echo "✅ Custom migration completed successfully!"
}

# Main menu
echo "Choose your migration option:"
echo "1) Local MySQL (localhost)"
echo "2) AWS RDS"
echo "3) Custom MySQL connection"
echo "4) Exit"
echo

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        run_local_migration
        ;;
    2)
        run_aws_migration
        ;;
    3)
        run_custom_migration
        ;;
    4)
        echo "👋 Migration cancelled."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Migration completed! Check the output above for any errors."
echo "📖 For more information, see: scripts/MIGRATION_README.md" 