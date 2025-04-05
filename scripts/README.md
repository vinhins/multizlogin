# Scripts Directory

This directory contains utility scripts for setting up and managing the Zalo server.

## Available Scripts

### prepare-docker.sh
Sets up the required directory structure and configuration files for Docker deployment.
- Creates the `zalo_data` directory with subdirectories
- Creates an empty `proxies.json` if it doesn't exist
- Sets up `.env` files for configuration

### update-zalo-server.sh
Updates and restarts the Zalo server with a new Docker image.
- Stops existing containers
- Builds a new image using docker-compose.new.yaml
- Starts services with the new image
- Cleans up old images

### migrate-to-zalo-data.sh
Migrates existing data to the new `zalo_data` directory structure.
- Copies existing proxies.json and webhook-config.json
- Copies credential files from the cookies directory
- Preserves original files for backup

### clean-for-publish.sh
Cleans sensitive information before publishing the Docker image.
- Backs up all sensitive files to a `pre_publish_backup` directory
- Removes credential files from the `zalo_data` directory
- Cleans .env files (keeps keys but removes values)
- Empties the cookies directory
- Run this script before building and publishing your Docker image

### restore-after-publish.sh
Restores sensitive information from backup after publishing.
- Restores .env files from backup
- Restores credential files and proxies.json
- Run this script after publishing to restore your working environment

### fix-docker-build.sh
Fixes issues with Docker builds, especially missing dependencies.
- Updates the Dockerfile to properly install all dependencies
- Updates .dockerignore to exclude unnecessary files
- Offers to build the Docker image immediately
- Resolves common issues like "Cannot find module 'ejs'" error

## Usage
These scripts should be run from the project root directory:

```bash
# Basic operations
bash scripts/prepare-docker.sh
bash scripts/update-zalo-server.sh
bash scripts/migrate-to-zalo-data.sh

# For publishing Docker images
bash scripts/clean-for-publish.sh     # Run before building and publishing
docker-compose build                  # Build the image
docker push your-image-name:tag       # Push the image to registry
bash scripts/restore-after-publish.sh # Restore your working environment

# Fix Docker build issues
bash scripts/fix-docker-build.sh      # Fix issues with Docker build
```

# Build image
docker build -t zalo-server .

# Gắn tag
docker tag zalo-server cangphamdocker/zalo-server:latest

# Push lên Docker Hub
docker push cangphamdocker/zalo-server:latest