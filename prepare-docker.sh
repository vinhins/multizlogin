#!/bin/bash

# Create zalo_data directory if it doesn't exist
mkdir -p zalo_data

# Create proxies.json if it doesn't exist
if [ ! -f "./zalo_data/proxies.json" ]; then
    echo "[]" > ./zalo_data/proxies.json
    echo "Created empty proxies.json"
fi

# Create .env file if it doesn't exist
if [ ! -f "./zalo_data/.env" ]; then
    cat > ./zalo_data/.env << EOF
MESSAGE_WEBHOOK_URL=
GROUP_EVENT_WEBHOOK_URL=
REACTION_WEBHOOK_URL=
PORT=3000
EOF
    echo "Created .env template in zalo_data directory"
    
    # Also create a root .env file for local development
    if [ ! -f "./.env" ]; then
        cp ./zalo_data/.env ./.env
        echo "Created .env file in root directory for local development"
    fi
fi

echo "Setup completed. You can now run 'docker-compose up -d'" 