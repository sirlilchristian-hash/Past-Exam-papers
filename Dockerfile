# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Run the unified Vite + esbuild compilation
RUN npm run build

# Stage 2: Production Server
FROM node:22-slim AS runner

WORKDIR /app

# Set Node environment to production
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port (Cloud Run defaults to 8080)
EXPOSE 8080

# Start the unified Express application
CMD ["npm", "start"]
