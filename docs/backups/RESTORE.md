# Restauración de Base de Datos (D'Mendoza)

Este documento describe el procedimiento probado para restaurar la base de datos a partir de un respaldo generado por el script `backup.sh`.

## Requisitos Previos

- Tener acceso al servidor o entorno donde está corriendo el contenedor de base de datos MySQL (ej: `docker-compose`).
- Disponer del archivo `.sql` de respaldo (por ejemplo: `dmendoza_backup_20260712_100000.sql`).

## Paso 1: Localizar el archivo de respaldo

Si estás utilizando contenedores Docker, los respaldos se encuentran montados típicamente en el volumen `./backups` de la raíz del proyecto.

## Paso 2: Ejecutar la Restauración

### Opción A: Desde el host hacia el contenedor Docker

Asumiendo que el contenedor de la base de datos se llama `dmendoza-db` y la base de datos es `dmendoza`:

```bash
docker exec -i dmendoza-db mysql -u root -p"tu_contraseña_root" dmendoza < ./backups/dmendoza_backup_20260712_100000.sql
```

> [!WARNING]
> Este comando **sobrescribirá** todos los datos de la base de datos actual. Asegúrate de ejecutarlo en el entorno correcto y usar el respaldo adecuado.

### Opción B: Directamente en un servidor MySQL local o remoto

Si no usas Docker, puedes restaurar usando el comando `mysql` estándar:

```bash
mysql -h localhost -u root -p dmendoza < /ruta/al/respaldo/dmendoza_backup_20260712_100000.sql
```

## Paso 3: Verificación de Integridad

Una vez restaurado el respaldo:
1. Inicia sesión en la plataforma usando una cuenta de administrador.
2. Navega al módulo de Ventas POS y verifica los últimos registros.
3. Asegúrate de que los cambios más recientes previstos en el momento del backup estén presentes.

> [!TIP]
> Es recomendable reiniciar la aplicación (Node.js) para invalidar cualquier caché en memoria o conexiones de Prisma que pudieran quedar desincronizadas (aunque Prisma suele manejarlo bien).
```bash
docker-compose restart api
```
