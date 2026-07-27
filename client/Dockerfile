# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Definir variables ARG para que Vite pueda inyectarlas en la build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar configuración e instalar dependencias
# Usamos --ignore-scripts para evitar problemas mencionados en la guía
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copiar el resto del código y compilar
COPY . .
RUN pnpm run build

# Stage 2: Serve
FROM nginx:alpine

# Copiar la build al directorio de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx (para fallback SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
