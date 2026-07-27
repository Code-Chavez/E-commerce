# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilar bcrypt y usar Prisma (Forzando IPv4 para evitar bugs de red de Docker)
RUN apt-get update -o Acquire::ForceIPv4=true && apt-get install -y -o Acquire::ForceIPv4=true \
    openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Instalar pnpm globalmente alineado con la versión del host
RUN npm install -g pnpm@10.8.0

COPY package.json pnpm-lock.yaml .npmrc ./

# Instalar TODAS las dependencias usando pnpm (congelando versiones del lockfile)
RUN pnpm config set fetch-retries 5 && pnpm config set fetch-retry-mintimeout 20000 && pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# Generar cliente de Prisma
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"
RUN pnpm prisma generate

# Transpilar TypeScript a JavaScript
RUN pnpm run build

# Stage 2: Production
FROM node:20-slim AS production

WORKDIR /app

RUN apt-get update -o Acquire::ForceIPv4=true && apt-get install -y -o Acquire::ForceIPv4=true \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Instalar pnpm globalmente para producción
RUN npm install -g pnpm@10.8.0

COPY package.json pnpm-lock.yaml .npmrc ./

# Instalar dependencias incluyendo tsx (necesario para ejecutar seed.ts en runtime)
RUN pnpm config set fetch-retries 5 && pnpm config set fetch-retry-mintimeout 20000 && pnpm install --frozen-lockfile --ignore-scripts

# Copiar archivos necesarios desde el stage builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copiar el cliente Prisma generado (es crucial porque pnpm install lo puede limpiar)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copiar y preparar el entrypoint de inicialización automática
COPY entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

EXPOSE 3000

# Ejecuta: migrate deploy → seed → node server.js
CMD ["./entrypoint.sh"]
