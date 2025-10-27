# syntax=docker/dockerfile:1

# Build stage: installs dependencies and creates the production bundle.
FROM node:20-alpine AS builder
WORKDIR /app

# Identificador del agente conversacional en ElevenLabs.
ARG VITE_ELEVENLABS_API_KEY
ARG VITE_ELEVENLABS_AGENT_ID

# Install dependencies with reliable layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the remainder of the project and run the Vite build.
COPY . .
RUN npm run build -- --base=/navia/

# Runtime stage: serve the upstream page enhanced with Navia via OpenResty (Nginx + Lua).
FROM openresty/openresty:1.25.3.1-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/navia

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
