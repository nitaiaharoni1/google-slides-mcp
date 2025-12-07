# Use Node.js LTS version with build tools for native modules
FROM node:20-slim

# Install build dependencies for native modules (sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
# Rebuild native modules for the container architecture
RUN npm ci --ignore-scripts && \
    npm rebuild sqlite3 --build-from-source

# Copy all source files
COPY . .

# Build the application
RUN npm run build && npm run build:types

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Set the entrypoint to run the MCP server
ENTRYPOINT ["node", "dist/server.js"]
