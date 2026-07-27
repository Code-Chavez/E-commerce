FROM alpine:3.18

# Instalar cliente de MariaDB y utilidades básicas
RUN apk add --no-cache mariadb-client bash tzdata curl

# Crear directorio para los backups
WORKDIR /backups

# Copiar el script de backup
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Configurar el cron (ej. todos los días a medianoche)
# "0 0 * * *" = medianoche
RUN echo "0 0 * * * /usr/local/bin/backup.sh" >> /etc/crontabs/root

# Iniciar el servicio crond nativo de Alpine en primer plano (foreground)
CMD ["crond", "-f", "-l", "2"]
