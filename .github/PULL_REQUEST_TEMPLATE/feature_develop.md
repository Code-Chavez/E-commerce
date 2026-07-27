## 📝 Descripción

[Explica brevemente qué se implementó o corrigió en este Pull Request]

## 📖 Ítem relacionado

- [ ] HU-XX: [Nombre de la Historia de Usuario]
- [ ] TT-XX: [Nombre de la Tarea Técnica]
- [ ] RSK-XX: [Nombre del Riesgo]

---

## ✅ Definition of Done — DoD-DM-001

Marca **todas** las casillas antes de solicitar la revisión. Este checklist es obligatorio para toda HU, TT y RSK sin excepción.

### C-01 · Criterios de Aceptación
- [ ] El ítem supera el 100 % de sus Criterios de Aceptación y Casos Límite definidos.
- [ ] El Product Owner otorgó su visto bueno sobre el entregable.

### C-02 · Calidad de Código
- [ ] El código compila sin errores (TypeScript estricto validado).
- [ ] Aplica Clean Code: nombres descriptivos, responsabilidad única, sin código muerto.
- [ ] La arquitectura del proyecto (Hexagonal / Feature-based) es respetada.

### C-03 · Pruebas
- [ ] El código nuevo cuenta con pruebas que validan su comportamiento.
- [ ] La suite de pruebas existente no presenta regresiones.
- [ ] Todas las pruebas pasan exitosamente en entorno local.

### C-04 · Seguridad
- [ ] No existen credenciales, tokens, API keys ni secretos en texto plano en el código o en archivos versionados.
- [ ] El código no introduce vulnerabilidades conocidas del OWASP Top 10 (SQL Injection, XSS, CSRF, etc.).

### C-05 · Revisión de Pares (Code Review)
- [ ] Al menos **2 desarrollador distinto al autor** aprobó este PR antes de fusionarlo.

### C-06 · Documentación Técnica
- [ ] El código está comentado donde sea necesario para su comprensión.
- [ ] Si se crearon o modificaron endpoints de API → documentación actualizada (Swagger / Postman).
- [ ] Si el ítem impacta al usuario final → borrador del Manual de Usuario actualizado.

### C-07 · Integración y Despliegue
- [ ] El código despliega exitosamente en el entorno de pruebas sin romper funcionalidad existente.
- [ ] Nuevas dependencias, variables de entorno o scripts de migración están documentados abajo (sección Notas).

### C-08 · Interfaz y Experiencia de Usuario
- [ ] No se introducen regresiones visuales ni de comportamiento en las interfaces existentes.
- [ ] Los componentes de UI entregados son responsivos (Mobile First) y compatibles con Chrome, Firefox, Safari y Edge.

### C-09 · GitFlow y Gestión del Tablero
- [ ] La rama proviene de `develop` y este PR apunta hacia `develop`.
- [ ] El nombre de la rama sigue la convención establecida por el equipo.
- [ ] La tarjeta en el Tablero Scrum fue movida a la columna **TERMINADO**.

---

## 📌 Notas adicionales

> Documenta aquí cualquier cambio de infraestructura necesario para que el equipo pueda correr este PR localmente:

- **Nuevas variables de entorno (`.env`):** <!-- ej. STRIPE_SECRET_KEY -->
- **Nuevas dependencias instaladas:** <!-- ej. npm install zod -->
- **Scripts de base de datos (Prisma / migraciones):** <!-- ej. npx prisma migrate dev -->
- **Otros:** <!-- cualquier paso adicional que el equipo deba ejecutar -->
