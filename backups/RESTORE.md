# Procedimiento de Restauración de Base de Datos — E-Commerce

Este documento describe el proceso exacto y probado para restaurar la base de datos MariaDB desde un archivo de respaldo generado por el servicio `db-backup`.

---

## Prerrequisitos

- Docker y Docker Compose instalados en el servidor.
- Acceso SSH o consola al servidor donde corre el stack.
- Variables de entorno del proyecto disponibles (`.env`).

---

## 1. Identificar el Backup a Restaurar

Los archivos de respaldo se almacenan en el volumen Docker `backup_data`, montado en `/backups` dentro del contenedor `db_backup_service`.

```bash
# Listar los backups disponibles dentro del contenedor
docker exec db_backup_service ls -lht /backups/

# Ejemplo de salida:
# -rw-r--r-- 1 root root 2.1M Jul 13 00:00 app_db_backup_20260713_000001.sql
# -rw-r--r-- 1 root root 2.0M Jul 12 00:00 app_db_backup_20260712_000001.sql
```

Selecciona el archivo más reciente o el correspondiente al punto de restauración deseado.

---

## 2. Copiar el Backup al Host

```bash
# Copiar el archivo desde el contenedor al directorio actual del host
docker cp db_backup_service:/backups/app_db_backup_20260713_000001.sql ./restore.sql
```

---

## 3. Restaurar la Base de Datos

**⚠️ ADVERTENCIA:** Este paso sobreescribirá todos los datos actuales en la base de datos. Asegúrate de hacer un respaldo del estado actual antes de continuar.

```bash
# Restaurar desde el archivo copiado al host
docker exec -i database_service mysql \
  -u root \
  -p"${DB_ROOT_PASSWORD}" \
  "${DB_DATABASE}" < ./restore.sql
```

Reemplaza `${DB_ROOT_PASSWORD}` y `${DB_DATABASE}` con los valores de tu `.env`.

**Alternativa** — restaurar directamente desde el volumen (sin copiar al host):

```bash
docker exec -i database_service bash -c \
  "mysql -u root -p\${MARIADB_ROOT_PASSWORD} \${MARIADB_DATABASE}" \
  < <(docker exec db_backup_service cat /backups/app_db_backup_20260713_000001.sql)
```

---

## 4. Verificar la Integridad Post-Restauración

```bash
# Verificar que las tablas principales existen y tienen datos
docker exec -i database_service mysql \
  -u root \
  -p"${DB_ROOT_PASSWORD}" \
  "${DB_DATABASE}" \
  -e "SHOW TABLES; SELECT COUNT(*) AS usuarios FROM User; SELECT COUNT(*) AS productos FROM Product;"
```

Resultado esperado: todas las tablas del schema deben aparecer y los conteos deben coincidir con los datos conocidos previos al incidente.

---

## 5. Reiniciar el Servidor de Aplicación

Después de restaurar la base de datos, reinicia el contenedor del servidor para asegurar que la caché de Prisma y las conexiones se renueven.

```bash
docker compose restart server
```

---

## 6. Notas sobre Retención y Rotación

- Los backups se retienen durante `RETENTION_DAYS` días (configurable vía `GET/PUT /api/v1/admin/backup-config`).
- Por defecto: **7 días**.
- El cron actual ejecuta el backup todos los días a las **00:00 UTC** (`0 0 * * *`).
- Para cambiar la frecuencia del cron, actualiza el campo `cronExpression` via API y reconstruye el contenedor `db-backup`: `docker compose up -d --build db-backup`.

---

## 7. Contacto en caso de Fallo

Si el backup falla, el sistema enviará automáticamente un correo de alerta al email configurado en `adminEmail` (configurable via `PUT /api/v1/admin/backup-config`). Por defecto: `admin@e-commerce.com`.
