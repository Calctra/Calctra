FROM node:16-alpine AS base

# Create app directory
WORKDIR /app

# Install dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production
# Separate development dependencies
RUN cp -R node_modules prod_modules
RUN npm ci

# Build application
FROM dependencies AS builder
COPY . .
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production

# Copy production dependencies and built app
COPY --from=dependencies /app/prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Copy necessary files
COPY .env.example ./.env.example

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S calctra -u 1001
USER calctra

# Expose ports
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"] 