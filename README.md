# D'Mendoza — Sistema Integrado de Gestión Comercial

Plataforma omnicanal para la gestión comercial de D'Mendoza, una empresa del sector retail de moda. Integra en un solo sistema la tienda online, el punto de venta físico y un panel administrativo centralizado con soporte para múltiples sucursales.

---

## Módulos

- **E-Commerce** — Tienda online con catálogo, carrito, pasarela de pagos, tracking de pedidos y programa de fidelización.
- **POS (Punto de Venta)** — Ventas físicas con gestión de caja, emisión de comprobantes térmicos y soporte para ventas entre sucursales (Cross-Branch).
- **Panel Administrativo** — Control centralizado de inventario, finanzas, logística de despacho, CRM y reportes de negocio.

---

## Tecnologías

| Capa          | Tecnología                      |
| ------------- | ------------------------------- |
| Frontend      | React, TypeScript               |
| Backend       | Node.js, Express.js, TypeScript |
| Base de datos | MariaDB, Prisma ORM             |

### Integraciones externas

| Servicio                            | Tipo                   | Uso                                                                                     |
| ----------------------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| [FACTILIZA](https://factiliza.com/) | Business API (Perú)    | WhatsApp Business, consulta DNI/RUC, emisión de boletas y facturas electrónicas (SUNAT) |
| [Resend](https://resend.com/)       | Email Delivery Service | Envío transaccional de correos (verificación, notificaciones, recordatorios)            |

---

## ⚙️ Instalación local (sin Docker)

```bash
# Clonar repositorio
git clone https://github.com/tu-org/d-mendoza-sistema.git
cd d-mendoza-sistema

# Instalar dependencias
cd server && npm install
cd ../client && npm install

# Ejecutar migraciones
cd server && npm run prisma:generate && npm run prisma:migrate

# Iniciar en desarrollo
npm run dev
```

---

## 🐳 Levantar con Docker

### Prerequisitos

- Tener [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo.

### Pasos iniciales

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/d-mendoza-sistema.git
cd d-mendoza-sistema

# 2. Copiar el archivo de variables de entorno y ajustar los valores
cp .env.example .env

# 3. Levantar todos los servicios en segundo plano
docker compose up -d
```

> Los contenedores arrancan en orden garantizado: `database` → `server` → `client`.
> El servidor espera a que MariaDB esté saludable antes de iniciar.

### Mantenimiento y Re-construcción

Si realizas cambios en los `Dockerfile`, archivos de configuración o dependencias (`package.json`), debes reconstruir las imágenes:

```bash
# Reconstruir imágenes
docker compose build

# Reconstruir sin usar cache (asegura limpieza total)
docker compose build --no-cache

# Levantar aplicando los cambios
docker compose up -d
```

### URLs de acceso

| Servicio | URL                              |
| -------- | -------------------------------- |
| Cliente  | http://localhost:5173            |
| Servidor | http://localhost:3000/api        |
| Health   | http://localhost:3000/api/health |

---

## 🗄️ Gestión de Base de Datos (Prisma)

Cuando se modifica el archivo `server/prisma/schema.prisma`, es necesario gestionar las migraciones para mantener sincronizada la base de datos y evitar errores de tipos.

### 1. Generar nueva migración (Desarrollo)

Si haces cambios en el schema, genera una migración localmente:

```bash
cd server
npx prisma migrate dev --name nombre_de_la_migracion
```

### 2. Generar Prisma Client

Para que TypeScript reconozca los nuevos modelos y evitar errores de compilación:

```bash
cd server
npx prisma generate
```

### 3. Aplicar migraciones en el Servidor / Producción

Al subir cambios al servidor, ejecuta este comando para aplicar las migraciones pendientes sin resetear la base de datos:

```bash
cd server
npx prisma migrate deploy
```

### 4. Ejecutar comandos dentro de Docker

Si prefieres no salir del entorno de Docker, usa `exec`:

```bash
# Generar cliente dentro del contenedor
docker compose exec server npm run prisma:generate

# Aplicar migraciones dentro del contenedor
docker compose exec server npm run prisma:migrate
```

---

## 🛠️ Comandos útiles

```bash
# Ver logs en tiempo real de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f server

# Ver el estado de los contenedores
docker compose ps

# Bajar todos los contenedores
docker compose down

# Bajar y eliminar los volúmenes (resetea la base de datos)
docker compose down -v
```

---

## 🔀 Flujo de Pull Requests

El proyecto usa **GitFlow**. Antes de abrir un PR, selecciona el template que corresponde según el tipo de cambio. GitHub no muestra un selector automático, por lo que usa los enlaces directos de abajo — cargan el formulario con el template correcto ya aplicado.

> ⚠️ Reemplaza `<rama-origen>` en la URL por el nombre real de tu rama antes de abrir el enlace.

| Tipo de PR | Rama origen → destino | Template | Enlace directo |
| --- | --- | --- | --- |
| Feature / HU / TT / RSK | `feature/xxx` → `develop` | `feature_develop.md` | [Abrir PR →](https://github.com/CFCamusDev/d-mendoza-project/compare/develop...<rama-origen>?template=feature_develop.md) |
| Release a producción | `release/x.x.x` → `main` | `release_main.md` | [Abrir PR →](https://github.com/CFCamusDev/d-mendoza-project/compare/main...<rama-origen>?template=release_main.md) |
| Hotfix crítico | `hotfix/xxx` → `main` | `hotfix_main.md` | [Abrir PR →](https://github.com/CFCamusDev/d-mendoza-project/compare/main...<rama-origen>?template=hotfix_main.md) |

### Estructura de templates

```
.github/
└── PULL_REQUEST_TEMPLATE/
    ├── feature_develop.md   ← HU / TT / RSK → develop  (DoD-DM-001 completo)
    ├── release_main.md      ← release/x.x.x → main     (Release Readiness)
    └── hotfix_main.md       ← hotfix/xxx    → main      (Hotfix Readiness)
```

> ⚠️ No debe existir un archivo `.github/pull_request_template.md` suelto en la raíz. Si existe, GitHub lo usa como default ignorando la carpeta y los templates no funcionarán.
