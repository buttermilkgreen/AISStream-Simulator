FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy application files
COPY server.js ./

# Expose the port the app runs on
EXPOSE 8088

# Start the application
CMD ["node", "server.js"]
