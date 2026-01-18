# Use official Node.js 24 image
FROM node:24-slim

# Set working directory
WORKDIR /app

# Copy only package files first (better layer caching)
COPY package.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy source code
COPY src/ ./src/

# Run the job
CMD ["node", "src/index.mjs"]