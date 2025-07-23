#!/bin/bash

# MongoDB to MySQL Migration with Bastion Host
# This script sets up an SSH tunnel and runs the migration

set -e  # Exit on any error

echo "🚀 MongoDB to MySQL Migration via Bastion Host"
echo "=============================================="

# Configuration - Update these values as needed
echo "🔧 Configuration:"
read -p "Path to bastion key file (default: ~/.ssh/bastion-key.pem): " BASTION_KEY_INPUT
BASTION_KEY="${BASTION_KEY_INPUT:-~/.ssh/bastion-key.pem}"
# Expand ~ to full path
BASTION_KEY="${BASTION_KEY/#\~/$HOME}"
# If user entered just the directory, append the filename
if [ -d "$BASTION_KEY" ]; then
    BASTION_KEY="$BASTION_KEY/bastion-key.pem"
fi
BASTION_HOST="35.168.23.3"
BASTION_USER="ec2-user"
RDS_HOST="scholarshipscraper-dev-mysqlinstance216dd474-5wsgcciykpks.cynq0w8k0976.us-east-1.rds.amazonaws.com"
RDS_PORT="3306"
LOCAL_PORT="3307"

# Database credentials
echo "🔐 Please provide your RDS database credentials:"
read -p "Database Name: " DB_NAME
read -p "Database User: " DB_USER
read -s -p "Database Password: " DB_PASSWORD
echo

# Check if bastion key exists
if [ ! -f "$BASTION_KEY" ]; then
    echo "❌ Bastion key file not found: $BASTION_KEY"
    echo "   Please ensure the key file is in the current directory or update the path."
    exit 1
fi

# Check if key has correct permissions
if [ "$(stat -c %a $BASTION_KEY 2>/dev/null || stat -f %Lp $BASTION_KEY 2>/dev/null)" != "600" ]; then
    echo "🔧 Setting correct permissions on bastion key..."
    chmod 600 "$BASTION_KEY"
fi

echo "🔗 Setting up SSH tunnel..."
echo "   Local port: $LOCAL_PORT"
echo "   Remote host: $RDS_HOST:$RDS_PORT"
echo "   Bastion: $BASTION_USER@$BASTION_HOST"

# Function to cleanup tunnel on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up SSH tunnel..."
    if [ ! -z "$SSH_PID" ]; then
        kill $SSH_PID 2>/dev/null || true
        echo "✅ SSH tunnel closed"
    fi
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start SSH tunnel in background
ssh -i "$BASTION_KEY" \
    -L "$LOCAL_PORT:$RDS_HOST:$RDS_PORT" \
    -o StrictHostKeyChecking=no \
    -o ExitOnForwardFailure=yes \
    -N "$BASTION_USER@$BASTION_HOST" &
SSH_PID=$!

# Wait a moment for tunnel to establish
echo "⏳ Waiting for SSH tunnel to establish..."
sleep 3

# Test the tunnel connection
echo "🔍 Testing database connection through tunnel..."
if ! mysql -h 127.0.0.1 -P "$LOCAL_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Database connection failed through tunnel."
    echo "   Please check your credentials and ensure the RDS instance is accessible."
    exit 1
fi

echo "✅ Database connection successful through tunnel!"

# Run schema creation
echo "🏗️  Creating database schema..."
mysql -h 127.0.0.1 -P "$LOCAL_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/schema.sql

# Run migration
echo "🔄 Running data migration..."
mysql -h 127.0.0.1 -P "$LOCAL_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < scripts/mongodb-to-mysql-converter-simple.sql

echo "✅ Migration completed successfully!"

# Run verification
echo "🔍 Running verification queries..."
mysql -h 127.0.0.1 -P "$LOCAL_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < scripts/verify-migration.sql

echo ""
echo "🎉 Migration and verification completed!"
echo "📖 For more information, see: scripts/MIGRATION_README.md"
echo ""
echo "💡 The SSH tunnel will remain open until you press Ctrl+C"
echo "   This allows you to run additional queries if needed." 