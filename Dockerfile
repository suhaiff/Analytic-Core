# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/AnalyticCore-Server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server code
COPY server/AnalyticCore-Server/ ./

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "index.js"]
