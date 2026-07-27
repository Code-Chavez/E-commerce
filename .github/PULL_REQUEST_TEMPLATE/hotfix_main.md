## 🚨 Hotfix a Producción

**Versión:** `v` <!-- ej. v1.4.1 -->
**Rama origen:** `hotfix/` <!-- ej. hotfix/fix-payment-crash -->
**Rama destino:** `main`

[Describe en una línea el problema crítico que este hotfix resuelve]

> ⚠️ Un hotfix está reservado exclusivamente para bugs críticos en producción. Si el cambio no es urgente o no proviene de un fallo activo en `main`, debe procesarse como una HU/TT normal hacia `develop`.

---

## 🐛 Descripción del Problema

**Ítem relacionado (si existe):** RSK-XX / HU-XX / TT-XX
**Severidad:** `Crítica` · `Alta`
**Impacto en producción:** [Describe qué funcionalidad está rota, cuántos usuarios afecta y desde cuándo]

## 🔧 Solución Implementada

[Explica brevemente qué se corrigió y por qué este enfoque es el adecuado para un contexto de emergencia]

---

## ✅ Hotfix Readiness Checklist

### H-01 · Justificación y Alcance
- [ ] El cambio corrige exclusivamente el bug crítico descrito. No incluye mejoras, refactorizaciones ni features adicionales.
- [ ] El Scrum Master o Líder Técnico autorizó la apertura de este hotfix.

### H-02 · Calidad de Código
- [ ] El código compila sin errores (TypeScript estricto validado).
- [ ] El fix es mínimo e invasivo: toca únicamente lo necesario para resolver el problema.
- [ ] La arquitectura del proyecto (Hexagonal / Feature-based) es respetada.

### H-03 · Pruebas
- [ ] Existe al menos una prueba que reproduce el bug y verifica que el fix lo resuelve.
- [ ] La suite de pruebas existente no presenta regresiones.
- [ ] Todas las pruebas pasan exitosamente en entorno local.

### H-04 · Seguridad
- [ ] No existen credenciales, tokens ni secretos en texto plano en el código o archivos versionados.
- [ ] El fix no introduce nuevas vulnerabilidades conocidas del OWASP Top 10.

### H-05 · Revisión de Pares (Code Review)
- [ ] Al menos **1 desarrollador distinto al autor** aprobó este PR antes de fusionarlo.

### H-06 · Validación en Staging
- [ ] El fix fue desplegado y verificado en el entorno de staging antes de apuntar a `main`.
- [ ] El Product Owner o Líder Técnico confirmó que el comportamiento en staging es el esperado.

### H-07 · Base de Datos y Configuración
- [ ] Si el fix requiere migraciones o cambios de configuración, estos fueron probados en staging y están documentados abajo.
- [ ] Existe un plan de rollback en caso de fallo durante el despliegue en producción.

### H-08 · Versionado y Registro de Cambios
- [ ] El número de versión fue actualizado (patch: `X.X.` **+1**) en los archivos correspondientes.
- [ ] El `CHANGELOG` fue actualizado con la descripción del bug corregido.

### H-09 · GitFlow
- [ ] La rama proviene de `main` (no de `develop`) y este PR apunta hacia `main`.
- [ ] Existe un PR paralelo (o se creará inmediatamente después del merge) para fusionar este hotfix también hacia `develop` (merge back obligatorio).
- [ ] El tag de versión patch (`vX.X.X`) será creado sobre `main` tras el merge.

---

## 🔁 Post-merge obligatorio

> ⚠️ Una vez fusionado hacia `main`, abrir inmediatamente el PR de merge back hacia `develop`. Si existe una rama `release/` activa en este momento, el merge back debe apuntar hacia ella en lugar de `develop` directamente.

- **PR de merge back (develop o release activo):** # <!-- completar con el número una vez creado -->

---

## 📌 Notas de Despliegue

- **Archivos modificados:** <!-- lista los archivos clave tocados por el fix -->
- **Variables de entorno nuevas o modificadas:** <!-- si aplica -->
- **Scripts de migración a ejecutar:** <!-- si aplica -->
- **Tiempo estimado de downtime (si aplica):** <!-- ej. ninguno / ~1 min -->
- **Pasos de verificación post-despliegue:** <!-- cómo confirmar que el fix está activo en producción -->