#!/bin/bash

# Script to fix Docker build issues with missing dependencies
echo "🔧 Fixing Docker build issues..."

# 1. Ensure Dockerfile is correctly set up
echo "📝 Updating Dockerfile to install dependencies properly..."

cat > Dockerfile << 'EOF'
FROM cangphamdocker/zalo-server:latest

# Set work directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy application code
COPY . /app/

# Tạo các thư mục dữ liệu cần thiết
RUN mkdir -p /app/data/cookies

# Mở cổng và định nghĩa điểm vào (entrypoint)
EXPOSE 3000
CMD ["node", "src/server.js"]
EOF

echo "✅ Dockerfile updated with proper dependency installation"

# 2. Create .dockerignore if it doesn't exist or update it
echo "📝 Updating .dockerignore file..."

cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
zalo_data
.git
.gitignore
.env
*.md
pre_publish_backup
EOF

echo "✅ .dockerignore updated"

# 3. Build the docker image
echo "🔨 Building Docker image..."
echo "Running: docker-compose -f docker-compose.new.yaml build"

# Ask if the user wants to build now
read -p "Do you want to build the Docker image now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    docker-compose -f docker-compose.new.yaml build
    
    echo "✅ Docker image built successfully"
    echo "✨ You can now run: docker-compose -f docker-compose.new.yaml up -d"
else
    echo "🔍 Build skipped. You can manually build the image with:"
    echo "docker-compose -f docker-compose.new.yaml build"
fi

docker-compose -f docker-compose.new.yaml up -d 