# frontend/Dockerfile
FROM node:20.19-alpine

# Set working directory
WORKDIR /app

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Copy package files first (for better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Angular dev server port
EXPOSE 4200

# Run Angular dev server with host binding for Docker
CMD ["ng", "serve"]
