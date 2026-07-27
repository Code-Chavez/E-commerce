#!/bin/bash

# Configuración leída de variables de entorno (pasadas por el docker-compose)
DB_HOST=${DB_HOST:-database}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_DATABASE}

# Nombre del archivo con la fecha actual
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="/backups/${DB_NAME}_backup_${DATE}.sql"

echo "[Backup] Iniciando respaldo de la base de datos '${DB_NAME}' en el host '${DB_HOST}'..."

# Volcado usando mysqldump
mysqldump -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "[Backup] Respaldo completado exitosamente: ${BACKUP_FILE}"

  # Retención de respaldos (por defecto 7 días si no se configura)
  RETENTION_DAYS=${RETENTION_DAYS:-7}
  echo "[Backup] Limpiando respaldos más antiguos que ${RETENTION_DAYS} días..."
  find /backups -name "${DB_NAME}_backup_*.sql" -type f -mtime +${RETENTION_DAYS} -exec rm -f {} \;
else
  echo "[Backup] ERROR: Falló el respaldo de la base de datos."

  # Eliminar el archivo parcial para no dejar basura
  rm -f "${BACKUP_FILE}"

  # Notificación via webhook al backend (que reenvía el email al administrador)
  if [ -n "${BACKUP_WEBHOOK_URL}" ] && [ -n "${BACKUP_WEBHOOK_SECRET}" ]; then
    curl -s -X POST "${BACKUP_WEBHOOK_URL}/api/v1/admin/backup-config/notify-failure" \
      -H "Content-Type: application/json" \
      -H "x-backup-secret: ${BACKUP_WEBHOOK_SECRET}" \
      -d "{\"database\":\"${DB_NAME}\",\"host\":\"${DB_HOST}\",\"date\":\"${DATE}\"}" \
      --max-time 10 \
      || echo "[Backup] No se pudo enviar la notificación de fallo al webhook."
  else
    echo "[Backup] BACKUP_WEBHOOK_URL o BACKUP_WEBHOOK_SECRET no configurados. Notificación omitida."
  fi

  exit 1
fi
