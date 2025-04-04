#!/bin/bash

echo "Stopping existing containers..."
docker-compose down

echo "Building new image..."
docker-compose -f docker-compose.new.yaml build

echo "Starting services with new image..."
docker-compose -f docker-compose.new.yaml up -d

echo "Cleaning up old images..."
docker image prune -f

echo "Zalo Server has been updated and restarted."
echo "You can check logs with: docker-compose -f docker-compose.new.yaml logs -f" 