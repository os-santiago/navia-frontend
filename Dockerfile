# syntax=docker/dockerfile:1

# Build stage: installs dependencies and creates the production bundle.
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies with reliable layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the remainder of the project and run the Vite build.
COPY . .
RUN npm run build

# Runtime stage: serve the built assets with Nginx.
FROM nginx:alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
