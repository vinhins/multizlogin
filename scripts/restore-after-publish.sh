#!/bin/bash

# Script to restore sensitive information after publishing Docker image
# Run this script from the project root directory

BACKUP_DIR="pre_publish_backup"

echo "🔄 Restoring sensitive information from backup..."

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Backup directory '$BACKUP_DIR' not found. Make sure you ran clean-for-publish.sh first."
    exit 1
fi

# 1. Restore .env files
if [ -f "$BACKUP_DIR/.env.bak" ]; then
    cp "$BACKUP_DIR/.env.bak" .env
    echo "  ✅ Restored .env"
fi

if [ -f "$BACKUP_DIR/config.env.bak" ]; then
    cp "$BACKUP_DIR/config.env.bak" src/config/.env
    echo "  ✅ Restored src/config/.env"
fi

# 2. Restore credential files
if [ -d "$BACKUP_DIR/zalo_data" ]; then
    # Create directories if they don't exist
    mkdir -p zalo_data
    
    # Restore credential files
    find "$BACKUP_DIR/zalo_data" -name "cred_*.json" -exec cp {} zalo_data/ \; 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "  ✅ Restored credential files"
    fi
    
    # Restore proxies.json
    if [ -f "$BACKUP_DIR/zalo_data/proxies.json" ]; then
        cp "$BACKUP_DIR/zalo_data/proxies.json" zalo_data/
        echo "  ✅ Restored proxies.json"
    fi
fi

echo "✨ Restoration completed! Your original configuration has been restored."
echo ""
echo "⚠️ Note: The backup directory '$BACKUP_DIR' has been preserved."
echo "   You can remove it with: rm -rf $BACKUP_DIR"
echo "   Only do this after verifying that your configuration is working correctly." 