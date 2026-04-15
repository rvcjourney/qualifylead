# ── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source + env file, then build
COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────
FROM caddy:2-alpine

# Copy Caddy config
COPY Caddyfile /etc/caddy/Caddyfile

# Copy built static files from the builder stage
COPY --from=builder /app/dist /usr/share/caddy

EXPOSE 80
