## 🚀 Release a Producción

**Versión:** `v` <!-- ej. v1.4.0 -->
**Rama origen:** `release/` <!-- ej. release/1.4.0 -->
**Rama destino:** `main`

[Describe brevemente el alcance de este release: qué módulos cubre y cuál es el objetivo principal de esta versión]

---

## 📦 Ítems incluidos en este Release

Lista todos los ítems que forman parte de esta versión. Cada uno debe haber completado su DoD (DoD-DM-001) en su PR a `develop` correspondiente.

| Código | Nombre | Responsable | PR a develop |
|--------|--------|-------------|--------------|
| HU-XX  |        |             | #            |
| TT-XX  |        |             | #            |
| RSK-XX |        |             | #            |

---

## ✅ Release Readiness Checklist

Marca **todas** las casillas antes de solicitar la aprobación. Este checklist es obligatorio para todo PR dirigido a `main`.

### R-01 · DoD de Ítems
- [ ] Todos los ítems listados arriba tienen su DoD-DM-001 satisfecho y sus PRs a `develop` aprobados y fusionados.
- [ ] No existen HU, TT ni RSK comprometidos para este release que estén pendientes o parcialmente terminados.

### R-02 · Versionado y Registro de Cambios
- [ ] El número de versión fue actualizado en los archivos correspondientes del proyecto (`package.json`, etc.).
- [ ] El `CHANGELOG` fue actualizado con el resumen de cambios, correcciones y notas de esta versión.

### R-03 · Validación en Staging
- [ ] El build desplegó exitosamente en el entorno de staging (pre-producción) sin errores de compilación.
- [ ] Se ejecutó una prueba de regresión completa en staging y no se detectaron fallos críticos.
- [ ] El Product Owner validó funcionalmente el release en el entorno de staging y otorgó su aprobación formal.

### R-04 · Base de Datos y Migraciones
- [ ] Las migraciones de base de datos fueron probadas en staging y son compatibles con el esquema actual de producción.
- [ ] Existe un plan de rollback de base de datos documentado en caso de fallo durante el despliegue.

### R-05 · Infraestructura y Configuración
- [ ] Las variables de entorno nuevas o modificadas están documentadas abajo y han sido comunicadas al responsable de infraestructura / DevOps.
- [ ] Las dependencias nuevas o actualizadas no introducen incompatibilidades conocidas con el entorno de producción.

### R-06 · Seguridad
- [ ] No existen credenciales, tokens ni secretos en texto plano en ningún archivo de esta rama.
- [ ] Los cambios de este release no introducen vulnerabilidades conocidas del OWASP Top 10.

### R-07 · GitFlow
- [ ] La rama proviene de `release/x.x.x` (derivada de `develop`) y este PR apunta hacia `main`.
- [ ] Existe un PR paralelo (o se creará inmediatamente después del merge) para fusionar esta rama también hacia `develop` (merge back obligatorio de GitFlow).
- [ ] El tag de versión (`vX.X.X`) será creado sobre `main` tras el merge.

---

## 🔁 Post-merge obligatorio

> ⚠️ Una vez aprobado y fusionado este PR hacia `main`, se debe abrir inmediatamente el PR de merge back hacia `develop` para mantener la sincronización de GitFlow. No cerrar este PR sin tener ese paso planificado.

- **PR de merge back a develop:** # <!-- completar con el número una vez creado -->

---

## 📌 Notas de Despliegue

> Documenta todo lo que el equipo de infraestructura / DevOps necesita saber para ejecutar este release en producción:

- **Nuevas variables de entorno (`.env` producción):** <!-- ej. RESEND_API_KEY -->
- **Scripts de migración a ejecutar:** <!-- ej. npx prisma migrate deploy -->
- **Orden de despliegue requerido:** <!-- ej. Backend antes que Frontend -->
- **Tiempo estimado de downtime (si aplica):** <!-- ej. ~2 min durante migración -->
- **Otros:** <!-- cualquier paso manual que el equipo deba ejecutar -->