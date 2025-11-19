# Frontend Dockerfile (Vite React -> NGINX)
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm i; fi
COPY . .
RUN npm run build

# Serve with nginx and proxy API to backend service
FROM nginx:1.25-alpine

# Nginx config to serve SPA and proxy API to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
