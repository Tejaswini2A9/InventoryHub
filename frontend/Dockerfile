# Stage 1: Build React Application
FROM node:20-alpine AS build

WORKDIR /app

# Declare build-time environment variable arguments
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the production bundle
RUN npm run build

# Stage 2: Serve the build using Nginx
FROM nginx:alpine

# Copy the build output to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the frontend
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
