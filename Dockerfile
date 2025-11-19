# Backend Dockerfile (Node + Express + EJS)
FROM node:20-alpine AS base
ENV NODE_ENV=production
WORKDIR /app

# Install only production deps first for better caching
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm i --omit=dev; fi

# Copy application source
COPY app.js ./
COPY db.js ./
COPY controllers ./controllers
COPY middlewares ./middlewares
COPY migrations ./migrations
COPY routes ./routes
COPY views ./views
COPY public ./public
COPY sql ./sql
COPY README.md ./README.md

# Ensure runtime port
ENV PORT=3001
EXPOSE 3001

CMD ["node", "app.js"]
