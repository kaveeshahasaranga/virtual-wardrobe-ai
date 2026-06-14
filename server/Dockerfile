# server/Dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src

# Environment
ENV NODE_ENV=production
ENV PORT=5001

# Install curl for healthchecks (lightweight)
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 5001

CMD ["node", "src/index.js"]
