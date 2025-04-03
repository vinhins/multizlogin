#!/bin/bash

# Create zalo_data directory if it doesn't exist
mkdir -p zalo_data

# Create proxies.json if it doesn't exist
if [ ! -f "./zalo_data/proxies.json" ]; then
    echo "[]" > ./zalo_data/proxies.json
    echo "Created empty proxies.json"
fi

# Handle .env file creation
# Check if .env.example exists in the root directory
if [ -f "./.env.example" ]; then
    echo "Found .env.example, using it as template..."
    
    # If .env doesn't exist in root, create it from .env.example
    if [ ! -f "./.env" ]; then
        cp ./.env.example ./.env
        echo "Created .env from .env.example in root directory"
    else
        echo "Root .env file already exists"
    fi
    
    # Copy root .env to zalo_data/.env for Docker
    cp ./.env ./zalo_data/.env
    echo "Copied .env to zalo_data directory for Docker"
else
    # No .env.example, create both files from scratch
    echo "No .env.example found, creating default .env files..."
    
    # Create .env in zalo_data directory if it doesn't exist
    if [ ! -f "./zalo_data/.env" ]; then
        cat > ./zalo_data/.env << EOF
MESSAGE_WEBHOOK_URL=
GROUP_EVENT_WEBHOOK_URL=
REACTION_WEBHOOK_URL=
PORT=3000
EOF
        echo "Created default .env template in zalo_data directory"
    fi
    
    # Create a root .env file for local development if it doesn't exist
    if [ ! -f "./.env" ]; then
        cp ./zalo_data/.env ./.env
        echo "Created .env file in root directory for local development"
    fi
fi

echo "Setup completed. You can now run 'docker-compose up -d'"
echo "Remember to update the webhook URLs in your .env file" 