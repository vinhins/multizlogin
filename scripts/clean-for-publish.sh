#!/bin/bash

# Script to clean sensitive information before publishing Docker image
# Run this script from the project root directory

echo "🧹 Cleaning project for Docker image publication..."

# 1. Create backup directory
BACKUP_DIR="pre_publish_backup"
echo "📁 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 2. Backup sensitive files
echo "💾 Backing up sensitive files..."
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/.env.bak"
    echo "  ✅ Backed up .env"
fi

if [ -f "src/config/.env" ]; then
    cp src/config/.env "$BACKUP_DIR/config.env.bak"
    echo "  ✅ Backed up src/config/.env"
fi

# 3. Backup and clean zalo_data directory
if [ -d "zalo_data" ]; then
    # Backup all credential files
    mkdir -p "$BACKUP_DIR/zalo_data"
    find zalo_data -name "cred_*.json" -exec cp {} "$BACKUP_DIR/zalo_data/" \; 2>/dev/null
    echo "  ✅ Backed up credential files"
    
    # Remove credential files from zalo_data
    find zalo_data -name "cred_*.json" -delete 2>/dev/null
    echo "  ✅ Removed credential files from zalo_data"
    
    # Backup proxies.json
    if [ -f "zalo_data/proxies.json" ]; then
        cp zalo_data/proxies.json "$BACKUP_DIR/zalo_data/"
        # Replace with empty array
        echo "[]" > zalo_data/proxies.json
        echo "  ✅ Backed up and cleaned proxies.json"
    fi
fi

# 4. Clean .env files by creating templates from them
if [ -f ".env" ]; then
    # Create a clean .env file (keep keys, remove values)
    grep -v '^#' .env | sed 's/=.*$/=/' > .env.clean
    mv .env.clean .env
    echo "  ✅ Cleaned .env (kept keys, removed values)"
fi

if [ -f "src/config/.env" ]; then
    # Create a clean config .env file
    grep -v '^#' src/config/.env | sed 's/=.*$/=/' > src/config/.env.clean
    mv src/config/.env.clean src/config/.env
    echo "  ✅ Cleaned src/config/.env (kept keys, removed values)"
fi

# 5. Make sure cookies directory is empty
mkdir -p zalo_data/cookies
rm -f zalo_data/cookies/* 2>/dev/null
echo "  ✅ Cleaned cookies directory"

echo "✨ Cleaning completed! The project is now ready for Docker image publication."
echo "📂 Original sensitive files are backed up in the '$BACKUP_DIR' directory"
echo ""
echo "🔄 To restore your configuration after publishing, run:"
echo "   mv $BACKUP_DIR/.env.bak .env (if applicable)"
echo "   mv $BACKUP_DIR/config.env.bak src/config/.env (if applicable)"
echo "   cp $BACKUP_DIR/zalo_data/cred_*.json zalo_data/ (if applicable)"
echo "   cp $BACKUP_DIR/zalo_data/proxies.json zalo_data/ (if applicable)" 