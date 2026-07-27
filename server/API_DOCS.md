# API Documentation - E-Commerce Project Backend

Esta documentación proporciona las especificaciones técnicas detalladas para consumir los endpoints de la API. Servirá de base para la integración con el cliente (Frontend).

## Índice de Endpoints

- [Autenticación](#autenticación)
  - [POST /api/v1/auth/register](#post-apiv1authregister)
  - [POST /api/v1/auth/verify](#post-apiv1authverify)
  - [POST /api/v1/auth/login](#post-apiv1authlogin)
  - [POST /api/v1/auth/forgot-password](#post-apiv1authforgotpassword)
  - [POST /api/v1/auth/reset-password](#post-apiv1authresetpassword)
- [Control de Acceso por Roles (RBAC)](#control-de-acceso-por-roles-rbac)
  - [POST /api/v1/roles](#post-apiv1roles)
  - [PUT /api/v1/users/:id/role](#put-apiv1usersidrole)
- [Administración de Clientes](#administración-de-clientes)
  - [GET /api/v1/admin/clients](#get-apiv1adminclients)
- [Perfil de Cliente](#perfil-de-cliente)
  - [GET /api/v1/profile](#get-apiv1profile)
  - [PATCH /api/v1/profile](#patch-apiv1profile)
- [Direcciones de Envío — HU-006](#direcciones-de-envío--hu-006)
  - [GET /api/v1/addresses](#get-apiv1addresses)
  - [POST /api/v1/addresses](#post-apiv1addresses)
  - [PUT /api/v1/addresses/:id](#put-apiv1addressesid)
  - [DELETE /api/v1/addresses/:id](#delete-apiv1addressesid)
- [Identidad Visual y Branding](#identidad-visual-y-branding)
  - [GET /api/v1/config/brand](#get-apiv1configbrand)
  - [PUT /api/v1/config/brand](#put-apiv1configbrand)
- [Sucursales y Almacenes](#sucursales-y-almacenes)
  - [GET /api/v1/branches](#get-apiv1branches)
  - [POST /api/v1/branches](#post-apiv1branches)
  - [PUT /api/v1/branches/:id](#put-apiv1branchesid)
  - [PATCH /api/v1/branches/:id/status](#patch-apiv1branchesidstatus)
- [Gestión de Proveedores — HU-051](#gestión-de-proveedores--hu-051)
  - [GET /api/v1/suppliers](#get-apiv1suppliers)
  - [POST /api/v1/suppliers](#post-apiv1suppliers)
  - [PUT /api/v1/suppliers/:id](#put-apiv1suppliersid)
  - [PATCH /api/v1/suppliers/:id/status](#patch-apiv1suppliersidstatus)
- [Ingreso de Mercadería — HU-051](#ingreso-de-mercadería--hu-051)
  - [GET /api/v1/variants/search](#get-apiv1variantssearch)
  - [POST /api/v1/stock/entries](#post-apiv1stockentries)
- [Visualización de Stock — HU-021](#visualización-de-stock--hu-021)
  - [GET /api/v1/stock](#get-apiv1stock)
- [Auditoría de Inventario Físico — HU-029](#auditoría-de-inventario-físico--hu-029)
  - [POST /api/v1/inventory-audits](#post-apiv1inventoryaudits)
- [Punto de Venta (POS) — HU-034](#punto-de-venta-pos--hu-034)
  - [POST /api/v1/pos/discounts/validate](#post-apiv1posdiscountsvalidate)
- [Apertura de Caja y Turnos — HU-032](#apertura-de-caja-y-turnos--hu-032)
  - [POST /api/v1/cash-turns/open](#post-apiv1cashturnsopen)
  - [GET /api/v1/cash-registers](#get-apiv1cashregisters)
  - [GET /api/v1/cash-turns/active](#get-apiv1cashturnsactive)
- [Blog y Posicionamiento SEO — HU-018](#blog-y-posicionamiento-seo--hu-018)
  - [GET /api/v1/blog](#get-apiv1blog)
  - [GET /api/v1/blog/:slug](#get-apiv1blogslug)
  - [GET /api/v1/admin/blog](#get-apiv1adminblog)
  - [GET /api/v1/admin/blog/:id](#get-apiv1adminblogid)
  - [POST /api/v1/admin/blog](#post-apiv1adminblog)
  - [PATCH /api/v1/admin/blog/:id](#patch-apiv1adminblogid)
  - [DELETE /api/v1/admin/blog/:id](#delete-apiv1adminblogid)
- [Exportación de Reportes — HU-053](#exportación-de-reportes--hu-053)
  - [GET /api/v1/reports/export](#get-apiv1reportsexport)
- [Reporte de Rentabilidad — HU-069](#reporte-de-rentabilidad--hu-069)
  - [GET /api/v1/admin/reports/profitability](#get-apiv1adminreportsprofitability)
- [Dashboard Financiero Consolidado Multi-canal — HU-070](#dashboard-financiero-consolidado-multi-canal--hu-070)
  - [GET /api/v1/admin/reports/financial-dashboard](#get-apiv1adminreportsfinancial-dashboard)
- [Conciliación de Transacciones — HU-073](#conciliación-de-transacciones--hu-073)
  - [POST /api/v1/admin/reconcile/stripe](#post-apiv1adminreconcilestripe)
- [Logística y Despachos — HU-058](#logística-y-despachos--hu-058)
  - [GET /api/v1/logistics/orders/pending](#get-apiv1logisticsorderspending)
  - [POST /api/v1/logistics/picking](#post-apiv1logisticspicking)
  - [GET /api/v1/logistics/deliveries](#get-apiv1logisticsdeliveries)
  - [GET /api/v1/logistics/delivery-men](#get-apiv1logisticsdelivery-men)
  - [POST /api/v1/logistics/deliveries/:id/assign](#post-apiv1logisticsdeliveriesidassign)
  - [GET /api/v1/logistics/deliveries/:id/label](#get-apiv1logisticsdeliveriesidlabel)
  - [PATCH /api/v1/logistics/deliveries/:id/status](#patch-apiv1logisticsdeliveriesidstatus)
- [Devoluciones y Logística Inversa — HU-065](#devoluciones-y-logística-inversa--hu-065)
  - [POST /api/v1/returns](#post-apiv1returns)
  - [PATCH /api/v1/admin/returns/:id/approve](#patch-apiv1adminreturnsidapprove)
  - [PATCH /api/v1/admin/returns/:id/reject](#patch-apiv1adminreturnsidreject)
  - [POST /api/v1/admin/returns/:id/credit-note](#post-apiv1adminreturnsidcredit-note)
- [Control de Cuentas por Cobrar y Créditos — HU-072](#control-de-cuentas-por-cobrar-y-créditos--hu-072)
  - [POST /api/v1/credits](#post-apiv1credits)
  - [POST /api/v1/credits/:id/payments](#post-apiv1creditsidpayments)
  - [GET /api/v1/credits](#get-apiv1credits)
- [Reporte de Productos con Baja Rotación — HU-074](#reporte-de-productos-con-baja-rotación--hu-074)
  - [GET /api/v1/admin/reports/low-rotation](#get-apiv1adminreportslow-rotation)
- [Gestión de Suscriptores al Newsletter — HU-088](#gestión-de-suscriptores-al-newsletter--hu-088)
  - [POST /api/v1/newsletter/subscribe](#post-apiv1newslettersubscribe)
  - [DELETE /api/v1/newsletter/unsubscribe](#delete-apiv1newsletterunsubscribe)
- [Historial de Comunicaciones al Cliente — HU-089](#historial-de-comunicaciones-al-cliente--hu-089)
  - [GET /api/v1/admin/clients/:id/communications](#get-apiv1adminclientsidcommunications)
- [Modelo de Predicción de Demanda y Sugerencias de Abastecimiento — HU-091](#modelo-de-predicción-de-demanda-y-sugerencias-de-abastecimiento--hu-091)
  - [GET /api/v1/admin/reports/demand-forecast](#get-apiv1adminreportsdemand-forecast)
  - [GET /api/v1/admin/reports/restock-suggestions](#get-apiv1adminreportsrestock-suggestions)



---

## Autenticación

### POST /api/v1/auth/register

Permite registrar una nueva cuenta de usuario en la plataforma. Por defecto, el usuario se crea en estado **inactivo** hasta que se complete el flujo de verificación posterior.

#### 1. Especificación del Endpoint

| Método | Ruta                    | Autenticación     | Rol Requerido |
| :----- | :---------------------- | :---------------- | :------------ |
| `POST` | `/api/v1/auth/register` | Ninguna (Público) | Invitado      |

#### 2. Cuerpo de la Petición (Request Body)

Se espera un objeto JSON con la siguiente estructura:

```json
{
  "email": "usuario@dominio.com",
  "password": "Password123!"
}
```

**Detalle de Campos:**

| Parámetro  | Tipo     | Requerido | Reglas de Validación                                                                  |
| :--------- | :------- | :-------- | :------------------------------------------------------------------------------------ |
| `email`    | `string` | Sí        | Debe ser un formato de email válido (`ejemplo@correo.com`).                           |
| `password` | `string` | Sí        | Mínimo 8 caracteres. Debe contener al menos una letra mayúscula y al menos un número. |

## 9. Módulo de POS (Punto de Venta)

### 9.1 Procesar Venta con Múltiples Pagos
- **URL:** `/api/v1/pos/sales`
- **Method:** `POST`
- **Auth Required:** Yes (Role: `ADMIN`, `SELLER`) + (Permission: `pos:sales`)
- **Body:**
```json
{
  "branchId": 1,
  "subtotal": 100.00,
  "discountTotal": 10.00,
  "total": 90.00,
  "items": [
    { "variantId": 5, "quantity": 2, "unitPrice": 50.00, "discountAmount": 10.00 }
  ],
  "payments": [
    { "method": "CASH", "amount": 50.00 },
    { "method": "YAPE", "amount": 40.00 }
  ]
}
```
- **Success Response:**
  - **Code:** 201 Created
  - **Content:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "COMPLETED",
    "subtotal": "100.00",
    "discountTotal": "10.00",
    "total": "90.00",
    "userId": 2,
    "branchId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```
- **Error Response (No Cash Turn Open):**
  - **Code:** 403 Forbidden
  - **Content:**
```json
{
  "success": false,
  "error": "No tienes un turno de caja abierto para registrar ventas."
}
```

### 9.2 Validar Descuentos (HU-034)

#### 3. Respuestas (Responses)

##### Exito (HTTP 201 Created)

Retornado cuando los datos son válidos y el usuario se ha guardado correctamente en el sistema.

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "usuario@dominio.com",
    "isActive": false,
    "message": "El usuario se ha creado correctamente. A la espera de verificación."
  }
}
```

##### Error de Validación (HTTP 400 Bad Request)

Retornado cuando los datos enviados no cumplen con las restricciones del esquema de Zod.

```json
{
  "success": false,
  "error": [
    {
      "code": "too_small",
      "minimum": 8,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "La contraseña debe tener al menos 8 caracteres",
      "path": ["password"]
    }
  ]
}
```

##### Error de Conflicto (HTTP 409 Conflict)

Retornado cuando el correo electrónico proporcionado ya se encuentra registrado en la base de datos.

```json
{
  "success": false,
  "error": "Correo electrónico ya registrado"
}
```

##### Error Interno (HTTP 500 Internal Server Error)

Retornado en caso de errores inesperados en el servidor.

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

### POST /api/v1/auth/verify

Permite activar una cuenta de usuario ingresando el código PIN numérico de 6 dígitos enviado previamente por correo electrónico.

#### 1. Especificación del Endpoint

| Método | Ruta                  | Autenticación     | Rol Requerido |
| :----- | :-------------------- | :---------------- | :------------ |
| `POST` | `/api/v1/auth/verify` | Ninguna (Público) | Invitado      |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "email": "usuario@dominio.com",
  "pin": "123456"
}
```

**Detalle de Campos:**

| Parámetro | Tipo     | Requerido | Reglas de Validación                                                    |
| :-------- | :------- | :-------- | :---------------------------------------------------------------------- |
| `email`   | `string` | Sí        | Debe coincidir con el correo registrado.                                |
| `pin`     | `string` | Sí        | Exactamente 6 caracteres numéricos. Corresponde al OTP enviado a email. |

#### 3. Respuestas (Responses)

##### Exito (HTTP 200 OK)

Retornado cuando el PIN es válido, no ha expirado, y la cuenta se activa exitosamente.

```json
{
  "success": true,
  "message": "Cuenta verificada exitosamente. Ya puedes iniciar sesión."
}
```

##### Error de Parámetros (HTTP 400 Bad Request)

Retornado si la estructura es inválida o si el PIN ingresado es incorrecto/inválido.

```json
{
  "success": false,
  "error": "PIN inválido o expirado"
}
```

##### Conflicto - Ya Verificado (HTTP 409 Conflict)

Retornado si el usuario ya se encuentra en estado Activo.

```json
{
  "success": false,
  "error": "La cuenta ya se encuentra verificada"
}
```

##### Expirado - Token Caducado (HTTP 410 Gone)

Retornado cuando el PIN superó el tiempo de vida configurado (24 horas).

```json
{
  "success": false,
  "error": "El código de verificación ha expirado. Por favor, regístrese nuevamente."
}
```

---

### POST /api/v1/auth/login

Autentica a un usuario mediante correo electrónico y contraseña. Retorna los datos básicos del usuario junto a una dupla de tokens JWT (`accessToken` de corta duración y `refreshToken` de larga duración) para el manejo de sesiones y control de acceso RBAC.

#### 1. Especificación del Endpoint

| Método | Ruta                 | Autenticación     | Rol Requerido |
| :----- | :------------------- | :---------------- | :------------ |
| `POST` | `/api/v1/auth/login` | Ninguna (Público) | Invitado      |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "email": "usuario@dominio.com",
  "password": "Password123!"
}
```

**Detalle de Campos:**

| Parámetro  | Tipo     | Requerido | Reglas de Validación                                    |
| :--------- | :------- | :-------- | :------------------------------------------------------ |
| `email`    | `string` | Sí        | Formato de correo electrónico válido.                   |
| `password` | `string` | Sí        | Cadena no vacía. Debe coincidir con el hash registrado. |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

Retornado cuando las credenciales son correctas y el usuario está activo. Se retornan tanto los datos de perfil seguros como los tokens de acceso.

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@dominio.com",
      "name": "Nombre Usuario",
      "lastLogin": "2026-05-10T16:10:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-05-10T16:10:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
}
```

##### Mala Petición - Validación (HTTP 400 Bad Request)

Retornado si no se envía un payload válido (ej. email con formato incorrecto).

```json
{
  "success": false,
  "error": [
    {
      "code": "invalid_string",
      "message": "Formato de correo electrónico no válido",
      "path": ["email"]
    }
  ]
}
```

##### No Autorizado - Credenciales Inválidas (HTTP 401 Unauthorized)

Retornado de forma genérica si el correo no existe o la contraseña es incorrecta. **Importante por seguridad:** La respuesta no revela cuál de los dos campos falló para prevenir ataques de enumeración de cuentas.

```json
{
  "success": false,
  "error": "Credenciales inválidas"
}
```

##### Prohibido - Cuenta Inactiva (HTTP 403 Forbidden)

Retornado cuando las credenciales son técnicamente correctas, pero la cuenta aún no ha sido verificada o ha sido inhabilitada.

```json
{
  "success": false,
  "error": "Cuenta inactiva o no verificada"
}
```

---

### POST /api/v1/auth/forgot-password

Solicita el envío de un correo electrónico con un enlace para restablecer la contraseña olvidada. Genera un token temporal de seguridad firmado con JWT.

#### 1. Especificación del Endpoint

| Método | Ruta                           | Autenticación     | Rol Requerido |
| :----- | :----------------------------- | :---------------- | :------------ |
| `POST` | `/api/v1/auth/forgot-password` | Ninguna (Público) | Invitado      |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "email": "usuario@dominio.com"
}
```

**Detalle de Campos:**

| Parámetro | Tipo     | Requerido | Reglas de Validación                  |
| :-------- | :------- | :-------- | :------------------------------------ |
| `email`   | `string` | Sí        | Formato de correo electrónico válido. |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

Retornado siempre que el formato del correo sea correcto, incluso si el usuario no existe (para evitar enumeración de cuentas y phishing).

```json
{
  "success": true,
  "message": "Si el correo está registrado, recibirás un enlace de recuperación en breve."
}
```

##### Error de Validación (HTTP 400 Bad Request)

Retornado si el valor de entrada no cumple con el formato de correo esperado por Zod.

```json
{
  "success": false,
  "error": [
    {
      "code": "invalid_string",
      "message": "Invalid email format",
      "path": ["email"]
    }
  ]
}
```

---

### POST /api/v1/auth/reset-password

Permite establecer una nueva contraseña en la cuenta del usuario validando previamente el token JWT temporal recibido por correo electrónico. Hashea y persiste las nuevas credenciales en la base de datos.

#### 1. Especificación del Endpoint

| Método | Ruta                          | Autenticación     | Rol Requerido |
| :----- | :---------------------------- | :---------------- | :------------ |
| `POST` | `/api/v1/auth/reset-password` | Ninguna (Público) | Invitado      |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "token": "eyJhbGciOiJIUzI...",
  "newPassword": "MiNuevaPassword2026!"
}
```

**Detalle de Campos:**

| Parámetro     | Tipo     | Requerido | Reglas de Validación                                                                                                             |
| :------------ | :------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `token`       | `string` | Sí        | El token JWT enviado al correo. No debe estar vacío ni expirado.                                                                 |
| `newPassword` | `string` | Sí        | Mínimo 8 caracteres. Debe contener al menos una letra mayúscula y al menos un número. No puede ser igual a la contraseña actual. |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

Retornado si el token es válido y la nueva contraseña ha sido guardada exitosamente. El usuario ya puede iniciar sesión.

```json
{
  "success": true,
  "message": "La contraseña ha sido restablecida con éxito."
}
```

##### Error de Validación (HTTP 400 Bad Request)

Retornado si el token está vacío o si la contraseña no cumple con los requisitos mínimos de seguridad de Zod.

```json
{
  "success": false,
  "error": [
    {
      "code": "too_small",
      "minimum": 8,
      "message": "La contraseña debe tener al menos 8 caracteres",
      "path": ["newPassword"]
    }
  ]
}
```

##### No Autorizado / Expirado (HTTP 401 Unauthorized)

Retornado cuando el token JWT es inválido, ha sido manipulado, ha sido utilizado previamente (ya que ahora son de un solo uso), o ha expirado su ventana de vida de 1 hora.

**Ejemplo Expirado:**

```json
{
  "success": false,
  "error": "El enlace de recuperación ha expirado. Por favor, solicita uno nuevo."
}
```

**Ejemplo Inválido:**

```json
{
  "success": false,
  "error": "El token de recuperación no es válido o ya fue utilizado."
}
```

##### No Encontrado (HTTP 404 Not Found)

Retornado si el token es estructuralmente válido pero el identificador del usuario no existe en la base de datos (usuario eliminado recientemente).

```json
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

---

## Control de Acceso por Roles (RBAC)

Este módulo administrativo gestiona el catálogo global de roles y la vinculación dinámica con las identidades de usuario, aplicando controles de seguridad estrictos de tipo privilegio mínimo.

### POST /api/v1/roles

Permite registrar una nueva definición de Rol en el catálogo central del sistema. Útil para escalar perfiles administrativos como Vendedores, Supervisores o Gestores.

#### 1. Especificación del Endpoint

| Método | Ruta            | Autenticación      | Permiso Requerido |
| :----- | :-------------- | :----------------- | :---------------- |
| `POST` | `/api/v1/roles` | JWT `Bearer Token` | `roles:manage`    |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "name": "SELLER",
  "description": "Acceso al panel de inventarios y ventas"
}
```

**Detalle de Campos:**

| Parámetro     | Tipo     | Requerido | Reglas de Validación                                                                             |
| :------------ | :------- | :-------- | :----------------------------------------------------------------------------------------------- |
| `name`        | `string` | Sí        | Mínimo 3 caracteres, Máximo 50. Se transformará automáticamente a mayúsculas para normalización. |
| `description` | `string` | No        | Máximo 255 caracteres. Opcional.                                                                 |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 201 Created)

Retornado cuando el Rol fue validado, es único y fue correctamente persistido.

```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "SELLER",
    "description": "Acceso al panel de inventarios y ventas",
    "createdAt": "2026-05-12T16:50:00.000Z",
    "updatedAt": "2026-05-12T16:50:00.000Z"
  }
}
```

##### Error de Validación (HTTP 400 Bad Request)

Falla sintáctica del payload de entrada detectada por Zod.

```json
{
  "success": false,
  "error": [
    {
      "message": "El nombre del rol debe tener al menos 3 caracteres",
      "path": ["name"]
    }
  ]
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token, es inválido o ha expirado.
- **HTTP 403 Forbidden**: Si el usuario está inactivo o carece del permiso administrativo `roles:manage`.

##### Conflicto (HTTP 409 Conflict)

Retornado si se intenta crear un nombre de rol que ya se encuentra ocupado.

```json
{
  "success": false,
  "error": "El rol 'SELLER' ya existe en el sistema"
}
```

---

### PUT /api/v1/users/:id/role

Permite asignar un rol existente del catálogo a un usuario específico del sistema mediante su identificador numérico.

#### 1. Especificación del Endpoint

| Método | Ruta                     | Autenticación      | Permiso Requerido |
| :----- | :----------------------- | :----------------- | :---------------- |
| `PUT`  | `/api/v1/users/:id/role` | JWT `Bearer Token` | `roles:manage`    |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "roleName": "SELLER"
}
```

**Detalle de Campos:**

| Parámetro  | Tipo     | Requerido | Reglas de Validación                                                |
| :--------- | :------- | :-------- | :------------------------------------------------------------------ |
| `roleName` | `string` | Sí        | Nombre exacto del rol que se desea vincular a la cuenta de usuario. |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

La vinculación relacional se ha completado satisfactoriamente en la base de datos.

```json
{
  "success": true,
  "message": "Rol 'SELLER' asignado exitosamente al usuario."
}
```

##### No Encontrado (HTTP 404 Not Found)

Emitido cuando el `id` de usuario en la URL no pertenece a ningún registro activo, o el `roleName` especificado no existe en el catálogo de Roles.

```json
{
  "success": false,
  "error": "El rol 'SELLER' no está definido en el sistema"
}
```

## Administración de Clientes

Este módulo permite a los administradores gestionar los perfiles de los clientes de la plataforma, listando registros unificados y vinculándolos con cuentas de e-commerce.

### GET /api/v1/admin/clients

Obtiene el listado unificado de clientes registrados en el sistema (POS y e-commerce), con paginación, filtros de tipo y búsqueda predictiva.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :----- | :----------------------- | :----------------- | :---------------- |
| `GET`  | `/api/v1/admin/clients` | JWT `Bearer Token` | `users:read`      |

#### 2. Parámetros Query (Query Parameters)

| Parámetro | Tipo | Requerido | Descripción | Valores Permitidos | Default |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | No | Número de página a consultar. | `>= 1` | `1` |
| `limit` | `number` | No | Cantidad de registros por página. | `>= 1` | `10` |
| `type` | `string` | No | Filtro de origen/estado de cuenta del cliente. | `POS`, `ECOMMERCE`, `ALL` | `ALL` |
| `search` | `string` | No | Texto de búsqueda que coincide con DNI/RUC, Nombre o Apellido. | Cualquier cadena de texto | - |

#### 3. Respuestas (Responses)

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "clients": [
    {
      "id": 1,
      "email": "client1@example.com",
      "name": "Juan",
      "lastName": "Pérez",
      "phone": "999888777",
      "documentType": "DNI",
      "documentId": "12345678",
      "address": "Av. Larco 123",
      "department": "Lima",
      "province": "Lima",
      "district": "Miraflores",
      "ubigeo": "150122",
      "userId": 10,
      "isActive": true,
      "type": "AMBOS",
      "createdAt": "2026-06-25T15:40:00.000Z",
      "updatedAt": "2026-06-25T15:40:00.000Z"
    },
    {
      "id": 2,
      "email": "client2@example.com",
      "name": "María",
      "lastName": "Gómez",
      "phone": null,
      "documentType": "RUC",
      "documentId": "20123456789",
      "address": null,
      "department": null,
      "province": null,
      "district": null,
      "ubigeo": null,
      "userId": null,
      "isActive": true,
      "type": "POS",
      "createdAt": "2026-06-25T15:42:00.000Z",
      "updatedAt": "2026-06-25T15:42:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "totalPages": 1,
    "limit": 10
  }
}
```

##### Solicitud Incorrecta (HTTP 400 Bad Request)

Se emite cuando algún parámetro query no cumple con las validaciones del esquema (por ejemplo, valor de tipo incorrecto).

```json
{
  "success": false,
  "error": [
    {
      "field": "type",
      "message": "Invalid enum value. Expected 'POS' | 'ECOMMERCE' | 'ALL', received 'INVALID'"
    }
  ]
}
```

---

## Perfil de Cliente

Este módulo permite al cliente autenticado autogestionar su información personal, incluyendo la carga segura de su foto de perfil y la obtención de los datos de su perfil actual.

### GET /api/v1/profile

Recupera la información detallada del perfil del usuario autenticado (nombre, apellido, teléfono, email, avatar).

#### 1. Especificación del Endpoint

| Método | Ruta              | Autenticación      | Rol Requerido         |
| :----- | :---------------- | :----------------- | :-------------------- |
| `GET`  | `/api/v1/profile` | JWT `Bearer Token` | Cualquier Autenticado |

#### 2. Cuerpo de la Petición (Request Body)

No requiere cuerpo de petición.

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

Retorna la información actual del usuario en la base de datos (excluyendo la contraseña y PINs sensibles).

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "cliente@dominio.com",
    "name": "Juan",
    "lastName": "Pérez",
    "phone": "+51999888777",
    "avatarUrl": "https://res.cloudinary.com/dugbrgwn8/image/upload/v123456789/profiles/juan_perez_123456789.png",
    "authProvider": "local",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-05-19T02:20:00.000Z"
  }
}
```

##### Acceso Denegado / No Encontrado (HTTP 401 / 404)

- **HTTP 401 Unauthorized**: Si falta el Token en los headers o si es inválido.
- **HTTP 404 Not Found**: Si el identificador de usuario en el token de autenticación no pertenece a ningún usuario registrado.

```json
{
  "success": false,
  "error": "Acceso no autorizado: Contexto de seguridad faltante"
}
```

---

### PATCH /api/v1/profile

Actualiza la información de perfil del usuario autenticado (nombre, apellido, teléfono) y permite cargar una nueva imagen para su avatar. Soporta peticiones `multipart/form-data`.

#### 1. Especificación del Endpoint

| Método  | Ruta              | Autenticación      | Rol Requerido |
| :------ | :---------------- | :----------------- | :------------ |
| `PATCH` | `/api/v1/profile` | JWT `Bearer Token` | Cliente       |

#### 2. Cuerpo de la Petición (Request Body)

Se espera una petición de tipo `multipart/form-data` con los siguientes campos opcionales:

**Detalle de Campos:**

| Campo      | Tipo     | Requerido | Reglas de Validación                                                                                   |
| :--------- | :------- | :-------- | :----------------------------------------------------------------------------------------------------- |
| `name`     | `string` | No        | Mínimo 2 caracteres, máximo 50. Nombre del cliente.                                                    |
| `lastName` | `string` | No        | Mínimo 2 caracteres, máximo 50. Apellido del cliente.                                                  |
| `phone`    | `string` | No        | Formato internacional E.164 obligatorio (debe coincidir con la expresión regular `^\+[1-9]\d{1,14}$`). |
| `avatar`   | `file`   | No        | Archivo de imagen de tipo JPEG, PNG o WEBP. Tamaño máximo permitido: 5MB.                              |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

Retornado cuando los campos son válidos, la imagen ha sido subida exitosamente al almacenamiento de Cloudinary y la información se ha actualizado de forma segura en la base de datos.

```json
{
  "success": true,
  "message": "Perfil actualizado correctamente",
  "data": {
    "id": 1,
    "email": "cliente@dominio.com",
    "name": "Juan",
    "lastName": "Pérez",
    "phone": "+51999888777",
    "avatarUrl": "https://res.cloudinary.com/dugbrgwn8/image/upload/v123456789/profiles/juan_perez_123456789.png",
    "authProvider": "local",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-05-19T02:20:00.000Z"
  }
}
```

##### Error de Validación (HTTP 400 Bad Request)

Retornado cuando el payload no cumple con las validaciones de Zod.

**Ejemplo de Teléfono Inválido:**

```json
{
  "success": false,
  "errors": [
    {
      "field": "phone",
      "message": "El número de teléfono debe estar en formato internacional E.164 (ej: +51999888777)"
    }
  ]
}
```

**Ejemplo de Tipo de Archivo Inválido:**

```json
{
  "success": false,
  "error": "Formato de archivo inválido. Solo se admiten imágenes."
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token en los headers o si es inválido.
- **HTTP 403 Forbidden**: Si el usuario está inactivo.

```json
{
  "success": false,
  "error": "Acceso denegado: Token de autenticación inválido"
}
```

---

## Identidad Visual y Branding

### GET /api/v1/config/brand

Obtiene la configuración actual de la identidad visual y branding del sistema (público para personalización dinámica en el frontend e-commerce).

#### 1. Especificación del Endpoint

| Método | Ruta                   | Autenticación     | Rol Requerido |
| :----- | :--------------------- | :---------------- | :------------ |
| `GET`  | `/api/v1/config/brand` | Ninguna (Público) | Invitado      |

#### 2. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

Retorna la configuración actual. Si no se ha configurado ninguna, retorna los valores por defecto del sistema.

```json
{
  "success": true,
  "data": {
    "id": 1,
    "brandName": "E-Commerce",
    "faviconUrl": "https://res.cloudinary.com/...",
    "logoHorizontalUrl": "https://res.cloudinary.com/...",
    "logoVerticalUrl": "https://res.cloudinary.com/...",
    "colorBrandBg": "#F7F7F5",
    "colorBrandPrimary": "#D9D9D2",
    "colorBrandText": "#6B6B6B",
    "colorBrandAccent": "#3F3F3F",
    "socialLinksJson": {
      "facebook": "https://facebook.com/e-commerce"
    },
    "updatedAt": "2026-05-20T16:53:28.000Z"
  }
}
```

---

### PUT /api/v1/config/brand

Actualiza la configuración de identidad visual y branding del sistema de forma global. Solo accesible para administradores. Registra la modificación en los logs de auditoría para su trazabilidad.

#### 1. Especificación del Endpoint

| Método | Ruta                   | Autenticación      | Permiso Requerido      |
| :----- | :--------------------- | :----------------- | :--------------------- |
| `PUT`  | `/api/v1/config/brand` | JWT `Bearer Token` | Admin (`roles:manage`) |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "brandName": "E-Commerce Premium",
  "faviconUrl": "https://res.cloudinary.com/...",
  "logoHorizontalUrl": "https://res.cloudinary.com/...",
  "logoVerticalUrl": "https://res.cloudinary.com/...",
  "colorBrandBg": "#F7F7F5",
  "colorBrandPrimary": "#D9D9D2",
  "colorBrandText": "#6B6B6B",
  "colorBrandAccent": "#3F3F3F",
  "socialLinksJson": {
    "facebook": "https://facebook.com/e-commerce",
    "instagram": "https://instagram.com/e-commerce"
  }
}
```

**Detalle de Campos:**

| Parámetro           | Tipo     | Requerido | Reglas de Validación                                     |
| :------------------ | :------- | :-------- | :------------------------------------------------------- |
| `brandName`         | `string` | Sí        | Nombre comercial visible del sistema.                    |
| `faviconUrl`        | `string` | No        | URL absoluta del favicon de la marca.                    |
| `logoHorizontalUrl` | `string` | No        | URL absoluta del logotipo horizontal de la marca.        |
| `logoVerticalUrl`   | `string` | No        | URL absoluta del logotipo vertical de la marca.          |
| `colorBrandBg`      | `string` | Sí        | Color principal de fondo (ej. `#F7F7F5`).                |
| `colorBrandPrimary` | `string` | Sí        | Color primario de la marca (ej. `#D9D9D2`).              |
| `colorBrandText`    | `string` | Sí        | Color principal del texto (ej. `#6B6B6B`).               |
| `colorBrandAccent`  | `string` | Sí        | Color de acento/resalte (ej. `#3F3F3F`).                 |
| `socialLinksJson`   | `object` | No        | Objeto JSON con urls de las redes sociales del comercio. |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "brandName": "E-Commerce Premium",
    "faviconUrl": "https://res.cloudinary.com/...",
    "logoHorizontalUrl": "https://res.cloudinary.com/...",
    "logoVerticalUrl": "https://res.cloudinary.com/...",
    "colorBrandBg": "#F7F7F5",
    "colorBrandPrimary": "#D9D9D2",
    "colorBrandText": "#6B6B6B",
    "colorBrandAccent": "#3F3F3F",
    "socialLinksJson": {
      "facebook": "https://facebook.com/e-commerce",
      "instagram": "https://instagram.com/e-commerce"
    },
    "updatedAt": "2026-05-20T16:54:00.000Z"
  }
}
```

---

### POST /api/v1/config/brand/upload

Sube un archivo de imagen al servidor de almacenamiento en la nube (Cloudinary) y devuelve la URL absoluta de la imagen.

#### 1. Especificación del Endpoint

| Método | Ruta                          | Autenticación      | Permiso Requerido      |
| :----- | :---------------------------- | :----------------- | :--------------------- |
| `POST` | `/api/v1/config/brand/upload` | JWT `Bearer Token` | Admin (`roles:manage`) |

#### 2. Cuerpo de la Petición (Request Body - multipart/form-data)

Se requiere que el Content-Type de la petición sea `multipart/form-data`.

| Parámetro | Tipo   | Requerido | Descripción |
| :-------- | :----- | :-------- | :---------- |
| `image`   | `File` | Sí        | Archivo de la imagen a subir (ej. PNG, JPG, WEBP). Tamaño máximo 5MB. |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 201 Created)

```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/tu-cloud-name/image/upload/v1684345231/logo-123456.png"
  }
}
```

##### Error de Archivo Faltante (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "La imagen del logo es requerida"
}
```

##### Error de Validación (HTTP 400 Bad Request)

Retornado si los campos enviados no cumplen con los tipos o validaciones de Zod.

```json
{
  "success": false,
  "error": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["brandName"],
      "message": "Required"
    }
  ]
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token en los headers o si es inválido.
- **HTTP 403 Forbidden**: Si el usuario autenticado no posee los permisos requeridos (`roles:manage`).

---

## Sucursales y Almacenes

Este módulo permite gestionar el catálogo de sucursales comerciales de la empresa. Cada sucursal creada tiene asociado de manera obligatoria y automática un almacén único (relación 1:1 de negocio) que se administra de forma independiente.

### GET /api/v1/branches

Recupera el listado completo de sucursales registradas en el sistema, incluyendo los detalles del almacén autogenerado asociado a cada una.

#### 1. Especificación del Endpoint

| Método | Ruta               | Autenticación      | Permiso Requerido |
| :----- | :----------------- | :----------------- | :---------------- |
| `GET`  | `/api/v1/branches` | JWT `Bearer Token` | `users:read`      |

#### 2. Cuerpo de la Petición (Request Body)

No requiere cuerpo de petición.

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sucursal Central",
      "address": "Av. Larco 123",
      "phone": "999888777",
      "isActive": true,
      "isMain": true,
      "warehouse": {
        "id": 101,
        "createdAt": "2026-05-20T17:00:00.000Z"
      },
      "createdAt": "2026-05-20T17:00:00.000Z",
      "updatedAt": "2026-05-20T17:00:00.000Z"
    }
  ]
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token en los headers o si es inválido.
- **HTTP 403 Forbidden**: Si el usuario carece del permiso `users:read`.

---

### POST /api/v1/branches

Registra una nueva sucursal comercial en el sistema y crea atómicamente en una única transacción de base de datos su almacén independiente 1:1 asociado.

#### 1. Especificación del Endpoint

| Método | Ruta               | Autenticación      | Permiso Requerido |
| :----- | :----------------- | :----------------- | :---------------- |
| `POST` | `/api/v1/branches` | JWT `Bearer Token` | `users:write`     |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "name": "Sucursal Norte",
  "address": "Calle Las Flores 456",
  "phone": "999888777",
  "isMain": false
}
```

**Detalle de Campos:**

| Parámetro | Tipo      | Requerido | Reglas de Validación                                                |
| :-------- | :-------- | :-------- | :------------------------------------------------------------------ |
| `name`    | `string`  | Sí        | Debe ser único. Mínimo 2 caracteres, máximo 100 caracteres.         |
| `address` | `string`  | No        | Dirección física de la sucursal. Máximo 255 caracteres.             |
| `phone`   | `string`  | No        | Número de teléfono de contacto. Máximo 20 caracteres.               |
| `isMain`  | `boolean` | No        | Si es `true`, marca la sucursal como principal y el resto en `false`.|

#### 3. Respuestas (Responses)

##### Éxito (HTTP 201 Created)

Retornado cuando la sucursal y su almacén se crean de forma atómica y exitosa.

```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Sucursal Norte",
    "address": "Calle Las Flores 456",
    "phone": "999888777",
    "isActive": true,
    "isMain": false,
    "warehouse": {
      "id": 102,
      "createdAt": "2026-05-20T17:30:00.000Z"
    },
    "createdAt": "2026-05-20T17:30:00.000Z",
    "updatedAt": "2026-05-20T17:30:00.000Z"
  }
}
```

##### Error de Validación (HTTP 400 Bad Request)

```json
{
  "success": false,
  "errors": [
    {
      "field": "name",
      "message": "El nombre debe tener al menos 2 caracteres"
    }
  ]
}
```

---

### PUT /api/v1/branches/:id

Actualiza parcialmente uno o más detalles de una sucursal existente por su ID numérico.

#### 1. Especificación del Endpoint

| Método | Ruta                   | Autenticación      | Permiso Requerido |
| :----- | :--------------------- | :----------------- | :---------------- |
| `PUT`  | `/api/v1/branches/:id` | JWT `Bearer Token` | `users:write`     |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "name": "Sucursal Norte Refactor",
  "address": null,
  "phone": "987654321",
  "isMain": true
}
```

**Detalle de Campos:**

| Parámetro | Tipo      | Requerido | Reglas de Validación                                                  |
| :-------- | :-------- | :-------- | :-------------------------------------------------------------------- |
| `name`    | `string`  | No        | Si se provee, debe ser único. Mínimo 2 caracteres, máximo 100.        |
| `address` | `string`  | No        | Puede ser `null` para eliminar la dirección. Máximo 255 caracteres.   |
| `phone`   | `string`  | No        | Puede ser `null` para eliminar el teléfono. Máximo 20 caracteres.     |
| `isMain`  | `boolean` | No        | Si es `true`, marca la sucursal como principal y el resto en `false`. |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Sucursal Norte Refactor",
    "address": null,
    "phone": "987654321",
    "isActive": true,
    "isMain": true,
    "warehouse": {
      "id": 102,
      "createdAt": "2026-05-20T17:30:00.000Z"
    },
    "createdAt": "2026-05-20T17:30:00.000Z",
    "updatedAt": "2026-05-20T17:35:00.000Z"
  }
}
```

##### No Encontrado (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "La sucursal no existe"
}
```

---

### PATCH /api/v1/branches/:id/status

Permite activar o desactivar una sucursal en el sistema, lo cual impacta su disponibilidad comercial general.

#### 1. Especificación del Endpoint

| Método  | Ruta                          | Autenticación      | Permiso Requerido |
| :------ | :---------------------------- | :----------------- | :---------------- |
| `PATCH` | `/api/v1/branches/:id/status` | JWT `Bearer Token` | `users:write`     |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "isActive": false
}
```

**Detalle de Campos:**

| Parámetro  | Tipo      | Requerido | Reglas de Validación                      |
| :--------- | :-------- | :-------- | :---------------------------------------- |
| `isActive` | `boolean` | Sí        | Determina el nuevo estado de la sucursal. |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "message": "Sucursal inactivada correctamente",
  "data": {
    "id": 2,
    "name": "Sucursal Norte Refactor",
    "address": null,
    "phone": "987654321",
    "isActive": false,
    "isMain": true,
    "warehouse": {
      "id": 102,
      "createdAt": "2026-05-20T17:30:00.000Z"
    },
    "createdAt": "2026-05-20T17:30:00.000Z",
    "updatedAt": "2026-05-20T17:40:00.000Z"
  }
}
```

##### No Encontrado (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "La sucursal no existe"
}
```

---

## Gestión de Proveedores — HU-051

Este módulo permite administrar el catálogo de proveedores del sistema, incluyendo su registro, actualización y gestión del estado activo/inactivo (baja lógica).

### GET /api/v1/suppliers

Retorna el listado completo de proveedores registrados, ordenados por fecha de creación descendente.

#### 1. Especificación del Endpoint

| Método | Ruta                | Autenticación      | Permiso Requerido |
| :----- | :------------------ | :----------------- | :---------------- |
| `GET`  | `/api/v1/suppliers` | JWT `Bearer Token` | `inventory:read`  |

#### 2. Cuerpo de la Petición (Request Body)

No requiere cuerpo de petición.

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ruc": "20123456789",
      "razonSocial": "Textiles S.A.C.",
      "contacto": "Pedro Gómez",
      "rubro": "General",
      "direccion": "Av. Industrial 123, Lima",
      "isActive": true,
      "createdAt": "2026-05-31T10:00:00.000Z",
      "updatedAt": "2026-05-31T10:00:00.000Z"
    }
  ]
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token o es inválido.
- **HTTP 403 Forbidden**: Si el usuario carece del permiso `inventory:read`.

---

### POST /api/v1/suppliers

Registra un nuevo proveedor en el sistema. El RUC debe ser único en la base de datos.

#### 1. Especificación del Endpoint

| Método | Ruta                | Autenticación      | Permiso Requerido  |
| :----- | :------------------ | :----------------- | :----------------- |
| `POST` | `/api/v1/suppliers` | JWT `Bearer Token` | `inventory:write`  |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "ruc": "20123456789",
  "razonSocial": "Textiles S.A.C.",
  "contacto": "Pedro Gómez",
  "rubro": "General",
  "direccion": "Av. Industrial 123, Lima"
}
```

**Detalle de Campos:**

| Parámetro    | Tipo     | Requerido | Reglas de Validación                                                    |
| :----------- | :------- | :-------- | :---------------------------------------------------------------------- |
| `ruc`        | `string` | Sí        | Exactamente 11 dígitos numéricos. Debe ser único en el sistema.         |
| `razonSocial`| `string` | Sí        | Mínimo 2 caracteres, máximo 200.                                        |
| `contacto`   | `string` | Sí        | Nombre de persona o área de contacto. Mínimo 2, máximo 100 caracteres.  |
| `rubro`      | `string` | Sí        | Rubro del proveedor. Mínimo 2, máximo 100 caracteres.                   |
| `direccion`  | `string` | No        | Dirección física del proveedor. Máximo 255 caracteres. Puede ser `null`.|

#### 3. Respuestas (Responses)

##### Éxito (HTTP 201 Created)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "ruc": "20123456789",
    "razonSocial": "Textiles S.A.C.",
    "contacto": "Pedro Gómez",
    "rubro": "General",
    "direccion": "Av. Industrial 123, Lima",
    "isActive": true,
    "createdAt": "2026-05-31T10:00:00.000Z",
    "updatedAt": "2026-05-31T10:00:00.000Z"
  }
}
```

##### Error de Validación (HTTP 400 Bad Request)

```json
{
  "success": false,
  "errors": [
    {
      "field": "ruc",
      "message": "El RUC debe tener al menos 11 dígitos"
    }
  ]
}
```

##### Conflicto (HTTP 409 Conflict)

Retornado si el RUC ya está registrado en el sistema.

```json
{
  "success": false,
  "error": "El RUC '20123456789' ya se encuentra registrado"
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token o es inválido.
- **HTTP 403 Forbidden**: Si el usuario carece del permiso `inventory:write`.

---

### PUT /api/v1/suppliers/:id

Actualiza los datos de un proveedor existente. Si se modifica el RUC, se valida que no esté en uso por otro proveedor.

#### 1. Especificación del Endpoint

| Método | Ruta                    | Autenticación      | Permiso Requerido |
| :----- | :---------------------- | :----------------- | :---------------- |
| `PUT`  | `/api/v1/suppliers/:id` | JWT `Bearer Token` | `inventory:write` |

#### 2. Cuerpo de la Petición (Request Body)

Todos los campos son opcionales; se actualiza únicamente lo que se envíe.

```json
{
  "razonSocial": "Textiles Premium S.A.C.",
  "contacto": "Carlos López",
  "rubro": "Textiles",
  "direccion": null
}
```

**Detalle de Campos:**

| Parámetro    | Tipo     | Requerido | Reglas de Validación                                            |
| :----------- | :------- | :-------- | :-------------------------------------------------------------- |
| `ruc`        | `string` | No        | Exactamente 11 dígitos numéricos. Debe ser único.               |
| `razonSocial`| `string` | No        | Mínimo 2 caracteres, máximo 200.                                |
| `contacto`   | `string` | No        | Mínimo 2 caracteres, máximo 100.                                |
| `rubro`      | `string` | No        | Rubro del proveedor. Mínimo 2, máximo 100 caracteres.           |
| `direccion`  | `string` | No        | Puede ser `null` para eliminar la dirección. Máximo 255.        |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "ruc": "20123456789",
    "razonSocial": "Textiles Premium S.A.C.",
    "contacto": "Carlos López",
    "rubro": "Textiles",
    "direccion": null,
    "isActive": true,
    "createdAt": "2026-05-31T10:00:00.000Z",
    "updatedAt": "2026-05-31T10:30:00.000Z"
  }
}
```

##### No Encontrado (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "El proveedor con ID 1 no existe"
}
```

##### Conflicto (HTTP 409 Conflict)

```json
{
  "success": false,
  "error": "El RUC '20999888777' ya se encuentra registrado"
}
```

---

### PATCH /api/v1/suppliers/:id/status

Activa o inactiva un proveedor (baja lógica). Un proveedor inactivo no puede ser utilizado en nuevos ingresos de mercadería.

#### 1. Especificación del Endpoint

| Método  | Ruta                           | Autenticación      | Permiso Requerido |
| :------ | :----------------------------- | :----------------- | :---------------- |
| `PATCH` | `/api/v1/suppliers/:id/status` | JWT `Bearer Token` | `inventory:write` |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "isActive": false
}
```

**Detalle de Campos:**

| Parámetro  | Tipo      | Requerido | Reglas de Validación                        |
| :--------- | :-------- | :-------- | :------------------------------------------ |
| `isActive` | `boolean` | Sí        | Determina el nuevo estado del proveedor.    |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "message": "Proveedor inactivado correctamente",
  "data": {
    "id": 1,
    "ruc": "20123456789",
    "razonSocial": "Textiles S.A.C.",
    "contacto": "Pedro Gómez",
    "rubro": "General",
    "direccion": "Av. Industrial 123, Lima",
    "isActive": false,
    "createdAt": "2026-05-31T10:00:00.000Z",
    "updatedAt": "2026-05-31T11:00:00.000Z"
  }
}
```

##### No Encontrado (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "El proveedor con ID 1 no existe"
}
```

---

## Ingreso de Mercadería — HU-051

Este módulo registra los ingresos de mercadería desde proveedores al almacén de una sucursal. Cada registro ejecuta una **transacción atómica** que:

1. Persiste el cabecero `StockEntry` y sus ítems `StockEntryItem`.
2. Actualiza (upsert) el stock actual en `BranchStock` por variante y sucursal.
3. Genera el asiento contable `ENTRADA` en el `KardexEntry` con saldo acumulado.

### GET /api/v1/variants/search

Busca variantes de productos por coincidencia parcial en el SKU de la variante o en el nombre del producto padre. Este endpoint está diseñado para alimentar selectores predictivos (Autocomplete) en la interfaz de usuario al registrar el ingreso de mercadería.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/variants/search` | JWT `Bearer Token` | `inventory:read` |

#### 2. Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `q` | `string` | Sí | Término de búsqueda (coincide parcialmente con el SKU o nombre del producto) |
| `limit` | `number` | No | Límite de resultados a retornar (por defecto `10`, máximo `50`) |

#### 3. Respuestas del Servidor

##### Búsqueda Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "sku": "CAMISA-M-AZUL",
      "productName": "Camisa de Algodón Manga Larga",
      "price": 45.00
    }
  ]
}
```

##### Petición Incorrecta (HTTP 400 Bad Request)

Si falta el parámetro `q` o está vacío.

```json
{
  "success": false,
  "error": "El parámetro de búsqueda \"q\" es requerido y no puede estar vacío"
}
```

---

### POST /api/v1/stock/entries

Registra un ingreso de mercadería desde un proveedor activo hacia el almacén de una sucursal.


#### 1. Especificación del Endpoint

| Método | Ruta                    | Autenticación      | Permiso Requerido |
| :----- | :---------------------- | :----------------- | :---------------- |
| `POST` | `/api/v1/stock/entries` | JWT `Bearer Token` | `inventory:write` |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "supplierId": 1,
  "invoiceNumber": "F001-00123",
  "branchId": 2,
  "items": [
    {
      "variantId": 10,
      "quantity": 50,
      "unitCost": 25.50
    },
    {
      "variantId": 15,
      "quantity": 30,
      "unitCost": 18.00
    }
  ],
  "distributionItems": [
    {
      "branchId": 2,
      "variantId": 10,
      "quantity": 30
    },
    {
      "branchId": 3,
      "variantId": 10,
      "quantity": 20
    }
  ]
}
```

**Detalle de Campos — Cabecero:**

| Parámetro | Tipo | Requerido | Reglas de Validación |
| :--- | :--- | :--- | :--- |
| `supplierId` | `number` | Sí | ID entero positivo. El proveedor debe existir y estar activo. |
| `invoiceNumber` | `string` | Sí | Número de comprobante de pago (factura/boleta). Máximo 50 caracteres. |
| `branchId` | `number` | Sí | ID entero positivo. Identifica la sucursal destino del ingreso (sucursal receptora principal). |
| `items` | `array` | Sí | Al menos 1 ítem. Cada ítem representa una variante de producto ingresada. |
| `distributionItems`| `array` | No | Lista opcional de asignaciones para distribuir el stock a sucursales secundarias durante el ingreso (HU-022). |

**Detalle de Campos — Ítems (`items[]`):**

| Parámetro | Tipo | Requerido | Reglas de Validación |
| :--- | :--- | :--- | :--- |
| `variantId` | `number` | Sí | ID entero positivo de la variante de producto (`ProductVariant`). |
| `quantity` | `number` | Sí | Cantidad ingresada. Debe ser un número positivo mayor a 0. |
| `unitCost` | `number` | Sí | Costo unitario de compra. Debe ser un número positivo mayor a 0. |

**Detalle de Campos — Distribución (`distributionItems[]`):**

| Parámetro | Tipo | Requerido | Reglas de Validación |
| :--- | :--- | :--- | :--- |
| `branchId` | `number` | Sí | ID entero positivo de la sucursal de destino. |
| `variantId` | `number` | Sí | ID entero positivo de la variante de producto a distribuir. |
| `quantity` | `number` | Sí | Cantidad a distribuir. Debe ser un número positivo mayor a 0. La suma de cantidades distribuidas por variante no debe superar la cantidad total ingresada en `items[]`. El remanente se asignará automáticamente a la sucursal receptora (`branchId`). |


#### 3. Respuestas (Responses)

##### Éxito (HTTP 201 Created)

Retornado cuando la transacción completa se ejecuta exitosamente. El stock y el Kardex han sido actualizados.

```json
{
  "success": true,
  "data": {
    "id": 5,
    "supplierId": 1,
    "supplierRazonSocial": "Textiles S.A.C.",
    "invoiceNumber": "F001-00123",
    "branchId": 2,
    "items": [
      {
        "id": 9,
        "variantId": 10,
        "quantity": 50,
        "unitCost": 25.50
      },
      {
        "id": 10,
        "variantId": 15,
        "quantity": 30,
        "unitCost": 18.00
      }
    ],
    "createdAt": "2026-05-31T14:00:00.000Z",
    "updatedAt": "2026-05-31T14:00:00.000Z"
  }
}
```

##### Error de Validación (HTTP 400 Bad Request)

Retornado cuando el payload no cumple con las restricciones del schema Zod.

```json
{
  "success": false,
  "errors": [
    {
      "field": "items",
      "message": "El ingreso debe contener al menos un ítem"
    },
    {
      "field": "items.0.unitCost",
      "message": "El costo unitario debe ser mayor a 0"
    }
  ]
}
```

##### Error de Regla de Negocio (HTTP 400 Bad Request)

Retornado cuando la suma de la distribución por variante excede el stock total ingresado (HU-022).

```json
{
  "success": false,
  "error": "La cantidad a distribuir (30) excede el total ingresado (20) para la variante 10."
}
```

##### No Encontrado (HTTP 404 Not Found)

Retornado si el `supplierId` no corresponde a ningún proveedor existente.

```json
{
  "success": false,
  "error": "El proveedor con ID 99 no existe"
}
```

##### Entidad no Procesable (HTTP 422 Unprocessable Entity)

Retornado si el proveedor existe pero se encuentra inactivo.

```json
{
  "success": false,
  "error": "El proveedor 'Textiles S.A.C.' se encuentra inactivo"
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token o es inválido.
- **HTTP 403 Forbidden**: Si el usuario carece del permiso `inventory:write`.

```json
{
  "success": false,
  "error": "Acceso denegado: Se requiere el permiso 'inventory:write'"
}
```

##### Error Interno (HTTP 500 Internal Server Error)

Retornado si falla la transacción de base de datos (ej. FK inválida en `variantId` o `branchId`). La transacción Prisma hace rollback automático garantizando consistencia.

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Visualización de Stock — HU-021

Este módulo permite consultar de forma centralizada el stock consolidado (global) y desglosado por sucursal de todas las variantes de producto activas del sistema.

### GET /api/v1/stock

Consulta la lista de existencias consolidadas y por sucursal. Soporta filtros opcionales de búsqueda.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/stock` | JWT `Bearer Token` | `inventory:read` |

#### 2. Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `variantId` | `number` | No | ID de la variante específica a consultar |
| `branchId` | `number` | No | ID de la sucursal para filtrar los desgloses de stock |
| `sku` | `string` | No | Filtro de coincidencia parcial en el SKU de la variante |

#### 3. Respuestas (Responses)

##### Consulta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "variantId": 10,
      "sku": "CAMISA-M-AZUL",
      "productName": "Camisa de Algodón Manga Larga",
      "globalStock": 80,
      "byBranch": [
        {
          "branchId": 2,
          "branchName": "Sucursal Norte",
          "quantity": 50
        },
        {
          "branchId": 3,
          "branchName": "Sucursal Sur",
          "quantity": 30
        }
      ]
    }
  ]
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token o es inválido.
- **HTTP 403 Forbidden**: Si el usuario carece del permiso `inventory:read`.

```json
{
  "success": false,
  "error": "Acceso denegado: Se requiere el permiso 'inventory:read'"
}
```

---

## Auditoría de Inventario Físico — HU-029

Este módulo permite registrar tomas o auditorías de inventario físico en las sucursales, comparando el conteo de existencias del personal (`physicalQty`) contra el stock registrado en el sistema (`systemQty`) y calculando las diferencias de manera automática.

### POST /api/v1/inventory-audits

Registra una auditoría de inventario físico. Si se guarda como `CONFIRMED`, sincroniza de manera atómica el stock físico e historial contable (asientos `AJUSTE` en Kardex).

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/inventory-audits` | JWT `Bearer Token` | `inventory:write` |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "branchId": 1,
  "status": "CONFIRMED",
  "items": [
    {
      "variantId": 10,
      "physicalQty": 45
    },
    {
      "variantId": 15,
      "physicalQty": 30
    }
  ]
}
```

**Detalle de Campos — Cabecero:**

| Parámetro | Tipo | Requerido | Reglas de Validación |
| :--- | :--- | :--- | :--- |
| `branchId` | `number` | Sí | ID entero positivo. La sucursal debe existir. |
| `status` | `string` | Sí | Debe ser `'PENDING'` (borrador/conteo preliminar) o `'CONFIRMED'` (aplica el ajuste de stock). |
| `items` | `array` | Sí | Al menos 1 ítem a auditar. |

**Detalle de Campos — Ítems (`items[]`):**

| Parámetro | Tipo | Requerido | Reglas de Validación |
| :--- | :--- | :--- | :--- |
| `variantId` | `number` | Sí | ID entero positivo de la variante a auditar. Debe existir. |
| `physicalQty` | `number` | Sí | Cantidad física real contada. Debe ser un número no negativo (mayor o igual a 0). |

#### 3. Respuestas (Responses)

##### Registro Exitoso (HTTP 201 Created)

Retornado cuando la auditoría se guarda correctamente. El cálculo de la diferencia se realiza automáticamente en base al stock actual de la sucursal.

```json
{
  "success": true,
  "data": {
    "id": 1,
    "branchId": 1,
    "status": "CONFIRMED",
    "items": [
      {
        "id": 1,
        "variantId": 10,
        "physicalQty": 45,
        "systemQty": 50,
        "difference": -5
      },
      {
        "id": 2,
        "variantId": 15,
        "physicalQty": 30,
        "systemQty": 30,
        "difference": 0
      }
    ],
    "createdAt": "2026-05-31T06:30:00.000Z",
    "updatedAt": "2026-05-31T06:30:00.000Z"
  }
}
```

##### Error de Validación (HTTP 400 Bad Request)

Si faltan parámetros o no corresponden con las especificaciones.

```json
{
  "success": false,
  "errors": [
    {
      "field": "status",
      "message": "El estado debe ser 'PENDING' o 'CONFIRMED'"
    }
  ]
}
```

##### Sucursal/Variante No Encontrada (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "La sucursal con ID 99 no existe"
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token o es inválido.
- **HTTP 403 Forbidden**: Si el usuario carece del permiso `inventory:write`.

```json
{
  "success": false,
  "error": "Acceso denegado: Se requiere el permiso 'inventory:write'"
}
```

---


## Apertura de Caja y Turnos — HU-032

Este módulo permite a los vendedores y administradores aperturar turnos de caja para registrar las operaciones del punto de venta (POS) vinculados a un monto de apertura.

### POST /api/v1/cash-turns/open

Apertura el turno de caja vinculándolo al vendedor autenticado.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/cash-turns/open` | JWT `Bearer Token` | Autenticado (`ADMIN` o `SELLER`) |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "registerId": 1,
  "openAmount": 150.00
}
```

**Detalle de Campos:**

| Parámetro | Tipo | Requerido | Reglas de Validación |
| :--- | :--- | :--- | :--- |
| `registerId` | `number` | Sí | ID entero positivo de la caja registradora. Debe existir y estar disponible (sin turnos abiertos activos). |
| `openAmount` | `number` | Sí | Monto inicial de apertura. Debe ser un número mayor o igual a 0. |

#### 3. Respuestas (Responses)

##### Apertura Exitosa (HTTP 201 Created)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "registerId": 1,
    "userId": 2,
    "openAmount": 150.00,
    "status": "OPEN",
    "openedAt": "2026-06-01T11:45:00.000Z",
    "closedAt": null,
    "createdAt": "2026-06-01T11:45:00.000Z",
    "updatedAt": "2026-06-01T11:45:00.000Z"
  }
}
```

##### Error de Validación (HTTP 400 Bad Request)

Si faltan parámetros o no corresponden con las especificaciones.

```json
{
  "success": false,
  "errors": [
    {
      "field": "registerId",
      "message": "El ID de la caja debe ser un entero positivo"
    }
  ]
}
```

##### Caja No Encontrada (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "La caja registradora con ID 99 no existe"
}
```

##### Caja Ocupada o Usuario con Turno Abierto (HTTP 409 Conflict)

Retornado si el vendedor ya tiene un turno abierto o si la caja seleccionada ya está ocupada por otro turno activo.

```json
{
  "success": false,
  "error": "La caja registradora 'Caja Principal' ya tiene un turno abierto activo"
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token o es inválido.
- **HTTP 403 Forbidden**: Si el usuario autenticado posee un rol diferente a `ADMIN` o `SELLER`.

```json
{
  "success": false,
  "error": "Acceso denegado: Solo los roles Administrador o Vendedor están autorizados para abrir caja"
}
```

---

### GET /api/v1/cash-registers

Obtiene la lista de todas las cajas registradoras asociadas a una sucursal específica.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cash-registers` | JWT `Bearer Token` | Autenticado (`ADMIN` o `SELLER`) |

#### 2. Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `branchId` | `number` | Sí | ID de la sucursal de la cual se desean obtener las cajas registradoras. |

#### 3. Respuestas (Responses)

##### Listado Exitoso (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "branchId": 1,
      "name": "Caja Principal - Sede Sur",
      "createdAt": "2026-06-01T11:00:00.000Z",
      "updatedAt": "2026-06-01T11:00:00.000Z"
    },
    {
      "id": 2,
      "branchId": 1,
      "name": "Caja Secundaria - Sede Sur",
      "createdAt": "2026-06-01T11:00:00.000Z",
      "updatedAt": "2026-06-01T11:00:00.000Z"
    }
  ]
}
```

##### Error de Parámetros (HTTP 400 Bad Request)

Retornado si falta el parámetro `branchId` o si es inválido.

```json
{
  "success": false,
  "error": "El parámetro branchId es obligatorio y debe ser un número entero"
}
```

---

### GET /api/v1/cash-turns/active

Obtiene el turno de caja abierto del usuario autenticado si es que existe. Utilizado para hidratar el estado de caja al cargar la aplicación.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cash-turns/active` | JWT `Bearer Token` | Autenticado (`ADMIN` o `SELLER`) |

#### 2. Respuestas (Responses)

##### Turno Activo Encontrado (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "registerId": 1,
    "userId": 2,
    "openAmount": 150.00,
    "status": "OPEN",
    "openedAt": "2026-06-01T11:45:00.000Z",
    "closedAt": null,
    "createdAt": "2026-06-01T11:45:00.000Z",
    "updatedAt": "2026-06-01T11:45:00.000Z"
  }
}
```

##### Sin Turno Activo (HTTP 200 OK)

Retornado cuando el usuario no tiene ningún turno de caja abierto en sesión.

```json
{
  "success": true,
  "data": null
}
```

---

### POST /api/v1/cash-registers

Crea una nueva caja registradora.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/cash-registers` | JWT `Bearer Token` | Administrador (`ADMIN`) |

#### 2. Cuerpo de la Solicitud (Request Body)

```json
{
  "branchId": 1,
  "name": "Caja Principal - Sede Larco"
}
```

#### 3. Respuestas (Responses)

##### Creación Exitosa (HTTP 201 Created)

```json
{
  "success": true,
  "data": {
    "id": 4,
    "branchId": 1,
    "name": "Caja Principal - Sede Larco",
    "createdAt": "2026-06-01T21:54:00.000Z",
    "updatedAt": "2026-06-01T21:54:00.000Z"
  }
}
```

##### Error de Validación (HTTP 400 Bad Request)

```json
{
  "success": false,
  "errors": [
    {
      "field": "name",
      "message": "El nombre debe tener al menos 3 caracteres"
    }
  ]
}
```

---

### PATCH /api/v1/cash-registers/:id

Actualiza la información de una caja registradora existente.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/api/v1/cash-registers/:id` | JWT `Bearer Token` | Administrador (`ADMIN`) |

#### 2. Cuerpo de la Solicitud (Request Body)

```json
{
  "name": "Caja Principal Renovada"
}
```

#### 3. Respuestas (Responses)

##### Actualización Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 4,
    "branchId": 1,
    "name": "Caja Principal Renovada",
    "createdAt": "2026-06-01T21:54:00.000Z",
    "updatedAt": "2026-06-01T21:55:00.000Z"
  }
}
```

---

### DELETE /api/v1/cash-registers/:id

Realiza la eliminación lógica (`isActive: false`) de una caja registradora.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `DELETE` | `/api/v1/cash-registers/:id` | JWT `Bearer Token` | Administrador (`ADMIN`) |

#### 2. Respuestas (Responses)

##### Eliminación Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "message": "Caja registradora eliminada lógicamente con éxito"
}
```

##### Conflicto - Turno Abierto (HTTP 409 Conflict)

```json
{
  "success": false,
  "error": "No se puede desactivar la caja registradora porque tiene un turno abierto actualmente"
}
```

---

### GET /api/v1/pos/products

Busca productos/variantes para el POS por SKU o nombre de producto, retornando el stock correspondiente a la sucursal del turno activo del usuario.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/pos/products` | JWT `Bearer Token` | Autenticado (`ADMIN` o `SELLER`) |

#### 2. Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `sku` | `string` | Sí | SKU exacto (para lector de código de barras) o coincidencia parcial del nombre del producto. |

#### 3. Respuestas (Responses)

##### Búsqueda Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "variantId": 12,
      "productId": 5,
      "sku": "CAM-M-BLUE",
      "name": "Camisa Denim - M - Blue",
      "baseName": "Camisa Denim",
      "price": 89.90,
      "stock": 25,
      "attributes": {
        "Talla": "M",
        "Color": "Blue"
      }
    }
  ]
}
```

##### Error - Parámetro Requerido Faltante (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "El parámetro de búsqueda (sku) es requerido y no puede estar vacío"
}
```

##### Error - Turno Cerrado o Sin Apertura de Caja (HTTP 400 Bad Request)

Retornado cuando el vendedor autenticado no ha realizado la apertura de caja para su sesión y por ende no se tiene una sucursal activa.

```json
{
  "success": false,
  "error": "No tienes un turno de caja abierto. Por favor, abre caja antes de realizar búsquedas o ventas en el POS."
}
```

---

### GET /api/v1/pos/clients/lookup

Consulta de forma predictiva los datos de DNI o RUC desde la API externa de Factiliza.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/pos/clients/lookup` | JWT `Bearer Token` | Autenticado (`ADMIN` o `SELLER`) |

#### 2. Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `type` | `string` | Sí | Tipo de documento, debe ser exactamente `DNI` o `RUC`. |
| `number` | `string` | Sí | Número de documento (8 dígitos para DNI, 11 dígitos para RUC). |

#### 3. Respuestas (Responses)

##### Búsqueda Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "success": true,
    "documentNumber": "73614169",
    "name": "JOSE PEDRO",
    "lastName": "CASTILLO TERRONES",
    "address": "CASERIO PUÑA",
    "department": "CAJAMARCA",
    "province": "CHOTA",
    "district": "TACABAMBA",
    "ubigeo": "060417"
  }
}
```

##### Documento no Encontrado o Inválido (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "Documento no encontrado en el padrón o inválido"
}
```

---

### POST /api/v1/pos/clients/quick-register

Realiza el registro rápido de un cliente en el POS utilizando datos de la API de Factiliza.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/pos/clients/quick-register` | JWT `Bearer Token` | Autenticado (`ADMIN` o `SELLER`) |

#### 2. Cuerpo de la Solicitud (Request Body)

```json
{
  "documentType": "DNI",
  "documentId": "73614169",
  "phone": "987654321",
  "email": "cliente@correo.com"
}
```

#### 3. Respuestas (Responses)

##### Registro Exitoso (HTTP 201 Created)

```json
{
  "success": true,
  "data": {
    "id": 15,
    "documentType": "DNI",
    "documentId": "73614169",
    "name": "JOSE PEDRO",
    "lastName": "CASTILLO TERRONES",
    "phone": "987654321",
    "email": "cliente@correo.com",
    "address": "CASERIO PUÑA",
    "department": "CAJAMARCA",
    "province": "CHOTA",
    "district": "TACABAMBA",
    "ubigeo": "060417",
    "userId": null,
    "createdAt": "2026-06-01T23:28:00.000Z",
    "updatedAt": "2026-06-01T23:28:00.000Z"
  }
}
```

##### Conflicto - Cliente ya existe en BD (HTTP 409 Conflict)

```json
{
  "success": false,
  "error": "El cliente con documento 73614169 ya se encuentra registrado en el sistema"
}
```

##### Error - Documento Inválido o No Existe en Factiliza (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "Cliente no encontrado o documento inválido (DNI: 00000000)"
}
```

---

### GET /api/v1/pos/clients/search

Realiza una búsqueda express de clientes locales registrados en el sistema por DNI, RUC o Nombre/Apellido con paginación máxima de 10 registros.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/pos/clients/search` | JWT `Bearer Token` | Autenticado (`ADMIN` o `SELLER`) |

#### 2. Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `q` | `string` | Sí | El término de búsqueda (coincide parcialmente por DNI, RUC, nombre o apellido). |
| `page` | `number` | No | Número de página para la paginación (por defecto es 1). |

#### 3. Respuestas (Responses)

##### Búsqueda Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "clients": [
    {
      "id": 15,
      "documentType": "DNI",
      "documentId": "73614169",
      "name": "JOSE PEDRO",
      "lastName": "CASTILLO TERRONES",
      "phone": "987654321",
      "email": "cliente@correo.com",
      "address": "CASERIO PUÑA",
      "department": "CAJAMARCA",
      "province": "CHOTA",
      "district": "TACABAMBA",
      "ubigeo": "060417",
      "userId": null,
      "createdAt": "2026-06-01T23:28:00.000Z",
      "updatedAt": "2026-06-01T23:28:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "totalPages": 1,
    "limit": 10
  }
}
```

##### Error - Parámetro q Faltante (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "El parámetro de búsqueda q es obligatorio"
}
```
>>>>>>> origin/develop

## Punto de Venta (POS) — HU-034

### POST /api/v1/pos/discounts/validate

Valida y calcula la aplicación de un descuento sobre un carrito de compra del POS. Requiere que el rol del usuario autenticado posea el permiso `pos:discounts` (Control RBAC). Devuelve el desglose financiero completo: subtotal, monto de descuento calculado y total final.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso RBAC Requerido |
| :----- | :--- | :------------ | :--------------------- |
| `POST` | `/api/v1/pos/discounts/validate` | Bearer JWT | `pos:discounts` |

> **Nota de Seguridad:** Este endpoint está protegido por el middleware `requirePermission('pos:discounts')`. Solo usuarios con roles que tengan este permiso asignado (ej. `ADMIN`, `CAJERO_SENIOR`) podrán acceder. Los intentos sin el permiso correcto retornarán `HTTP 403 Forbidden`.

#### 2. Cuerpo de la Petición (Request Body)

Se espera un objeto JSON con la siguiente estructura:

```json
{
  "items": [
    {
      "variantId": 12,
      "quantity": 2,
      "unitPrice": 49.99
    },
    {
      "variantId": 7,
      "quantity": 1,
      "unitPrice": 25.00
    }
  ],
  "discountType": "percentage",
  "discountValue": 10
}
```

#### 3. Campos del Request Body

| Campo | Tipo | Requerido | Descripción |
| :---- | :--- | :-------- | :---------- |
| `items` | `Array` | Sí | Lista de ítems del carrito. Debe tener al menos 1 elemento. |
| `items[].variantId` | `number (int)` | Sí | ID del `ProductVariant` a vender. |
| `items[].quantity` | `number (int)` | Sí | Cantidad de unidades. Debe ser mayor que 0. |
| `items[].unitPrice` | `number` | Sí | Precio unitario del ítem en moneda local. No negativo. |
| `discountType` | `"percentage" \| "fixed"` | Sí | Modalidad del descuento. `"percentage"` aplica un porcentaje sobre el subtotal. `"fixed"` aplica un monto fijo. |
| `discountValue` | `number` | Sí | Valor del descuento. Para `"percentage"`: valor entre 0.01 y 100. Para `"fixed"`: valor positivo que no supere el subtotal. |

#### 4. Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "subtotal": 124.98,
    "discountType": "percentage",
    "discountValue": 10,
    "discountAmount": 12.50,
    "total": 112.48,
    "appliedBy": {
      "userId": 3,
      "email": "cajero@e-commerce.com"
    }
  }
}
```

#### 5. Respuestas de Error

**HTTP 400 — Validación fallida (datos inválidos)**

```json
{
  "success": false,
  "error": [
    {
      "code": "too_small",
      "message": "Se requiere al menos un ítem para calcular el descuento",
      "path": ["items"]
    }
  ]
}
```

**HTTP 400 — Porcentaje superior al 100%**

```json
{
  "success": false,
  "error": "El descuento porcentual no puede superar el 100%"
}
```

**HTTP 400 — Descuento fijo mayor que el subtotal**

```json
{
  "success": false,
  "error": "El descuento fijo no puede superar el subtotal de la orden"
}
```

**HTTP 401 — Token faltante o inválido**

```json
{
  "success": false,
  "error": "Acceso no autorizado: Token faltante o con formato incorrecto"
}
```

**HTTP 403 — Rol sin permiso `pos:discounts`**

```json
{
  "success": false,
  "error": "Acceso denegado: Se requiere el permiso 'pos:discounts'"
}
```

---

### 3. Emisión de Comprobante (Receipt)

**`GET /api/v1/pos/sales/:id/receipt`**

Devuelve los datos completos y estructurados de una venta específica, optimizados para la impresión del ticket en el POS (comprobante térmico de 58/80mm).

- **Permisos requeridos:** `pos:sales:read` o `pos:sales`
- **Response Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "date": "2026-06-02T12:00:00.000Z",
    "seller": "Carlos Mendoza",
    "branch": {
      "id": 1,
      "name": "Sede Principal",
      "address": "Av. Central 123",
      "phone": "999888777"
    },
    "items": [
      {
        "id": 1,
        "name": "Aceite Motor 5W30",
        "sku": "LUB-001",
        "quantity": 2,
        "unitPrice": 45.00,
        "discountAmount": 0.00,
        "lineTotal": 90.00,
        "isCrossBranch": false
      }
    ],
    "totals": {
      "subtotal": 90.00,
      "discountTotal": 0.00,
      "total": 90.00,
      "paid": 100.00,
      "change": 10.00
    },
    "payments": [
      {
        "method": "CASH",
        "amount": 100.00
      }
    ]
  }
}
```

---

### GET /api/v1/pos/stock/cross-branch

Consulta el stock de una variante de producto en todas las sucursales activas, excluyendo la sucursal del turno actual del vendedor.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/pos/stock/cross-branch` | JWT `Bearer Token` | Autenticado (`ADMIN` o `SELLER`) |

#### 2. Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `variantId` | `number` | Sí | El ID de la variante de producto a consultar. |

#### 3. Respuestas (Responses)

##### Consulta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "branchId": 2,
      "branchName": "Sede Miraflores",
      "quantity": 15
    },
    {
      "branchId": 3,
      "branchName": "Sede Larco",
      "quantity": 5
    }
  ]
}
```

##### Error - Parámetro variantId Inválido (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "El parámetro variantId debe ser un número entero positivo"
}
```

##### Error - Turno Cerrado o Sin Apertura de Caja (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "No tienes un turno de caja abierto. Por favor, abre caja antes de realizar consultas de stock intersucursales."
}
```

##### Error - Variante No Encontrada (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "La variante de producto con ID 999 no existe o se encuentra inactiva"
}
```

---

### POST /api/v1/stock-transfers

Registra y ejecuta una transferencia interna de stock de una variante de producto desde una sucursal de origen hacia otra de destino. Descuenta el inventario en la de origen, lo incrementa en la de destino, y genera los asientos de Kardex (SALIDA y ENTRADA) correspondientes.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/stock-transfers` | JWT `Bearer Token` | Permiso `inventory:write` |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "fromBranchId": 1,
  "toBranchId": 2,
  "variantId": 15,
  "quantity": 5
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `fromBranchId` | `number` | Sí | El ID de la sucursal de origen (debe existir y estar activa). |
| `toBranchId` | `number` | Sí | El ID de la sucursal de destino (debe existir, estar activa y ser diferente del origen). |
| `variantId` | `number` | Sí | El ID de la variante de producto a transferir (debe existir y estar activa). |
| `quantity` | `number` | Sí | La cantidad de unidades a transferir (debe ser un número entero o decimal positivo). |

#### 3. Respuestas (Responses)

##### Transferencia Exitosa (HTTP 201 Created)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "fromBranchId": 1,
    "toBranchId": 2,
    "variantId": 15,
    "quantity": 5,
    "status": "CONFIRMED",
    "createdAt": "2026-06-10T08:14:00.000Z",
    "updatedAt": "2026-06-10T08:14:00.000Z",
    "fromBranch": {
      "id": 1,
      "name": "Sede Central",
      "isActive": true
    },
    "toBranch": {
      "id": 2,
      "name": "Sede San Isidro",
      "isActive": true
    },
    "variant": {
      "id": 15,
      "sku": "CAM-M-ROJO",
      "price": 49.90,
      "isActive": true
    }
  }
}
```

##### Error - Stock Insuficiente (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "Stock insuficiente en la sucursal de origen. Stock disponible: 3"
}
```

##### Error - Sucursales Iguales (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "La sucursal de origen y destino no pueden ser la misma"
}
```

##### Error - Recurso No Encontrado o Inactivo (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "La variante del producto no existe o se encuentra inactiva"
}
```

---

### GET /api/v1/stock-transfers/:id/guide

Genera y descarga la Guía de Transferencia Interna en formato PDF para una transferencia específica.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/stock-transfers/:id/guide` | JWT `Bearer Token` | Permiso `inventory:read` |

#### 2. Parámetros de Ruta (Path Parameters)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `number` | Sí | El ID único de la transferencia interna registrada. |

#### 3. Respuestas (Responses)

##### Generación Exitosa (HTTP 200 OK)

Retorna un archivo binario (stream) con `Content-Type: application/pdf`.
Cabeceras incluidas:
- `Content-Disposition: attachment; filename="guia-transferencia-<id>.pdf"`

##### Error - Transferencia No Encontrada (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "Transferencia no encontrada"
}
```

##### Error - Parámetro Inválido (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "ID de transferencia inválido"
}
```

---

### POST /api/v1/pos/sales (Soporte Cross-Branch)

Registra una venta desde el POS. Permite indicar de forma opcional si es una venta Cross-Branch para reservar stock en la sucursal de origen en lugar de descontar directamente y generar Kardex.

#### 1. Nuevos Campos en el Request Body

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `isCrossBranch` | `boolean` | No | Indica si la venta toma stock de otra sucursal (`default: false`). |
| `sourceBranchId` | `number` | No | ID de la sucursal de origen de donde proviene el stock físico. |
| `documentType` | `string` | No | Tipo de comprobante formal a emitir: `BOLETA`, `FACTURA` o `TICKET` (`default: TICKET`). |

---

### PATCH /api/v1/pos/sales/:id/confirm-cross-branch

Confirma la entrega física de una venta Cross-Branch. Esto cambia el estado de stock en la sucursal de origen de `RESERVED` a `SOLD`, genera el asiento correspondiente de `SALIDA` en el Kardex de origen y registra la auditoría.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/api/v1/pos/sales/:id/confirm-cross-branch` | JWT `Bearer Token` | Autenticado |

#### 2. Respuestas (Responses)

##### Confirmación Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 12,
    "status": "COMPLETED",
    "subtotal": 120.00,
    "discountTotal": 0.00,
    "total": 120.00,
    "branchId": 1,
    "isCrossBranch": true,
    "sourceBranchId": 2,
    "createdAt": "2026-06-10T09:40:00.000Z",
    "updatedAt": "2026-06-10T09:42:00.000Z"
  }
}
```

##### Error - No es Venta Cross-Branch (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "Esta orden no corresponde a una venta Cross-Branch"
}
```

##### Error - Ya Confirmada Previamente (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "Esta venta Cross-Branch ya ha sido confirmada previamente"
}
```

---

### GET /api/v1/admin/cross-branch/pending

Obtiene las ventas Cross-Branch que están pendientes de entrega física, agrupadas por sucursal de origen (sucursal proveedora de stock).

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/cross-branch/pending` | JWT `Bearer Token` | Permiso `inventory:read` |

#### 2. Respuestas (Responses)

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "sourceBranchId": 1,
      "sourceBranchName": "Sede Central",
      "pendingOrdersCount": 1,
      "totalReservedUnits": 2,
      "orders": [
        {
          "orderId": 12,
          "destinationBranchId": 2,
          "destinationBranchName": "Sede San Isidro",
          "totalAmount": 99.80,
          "createdAt": "2026-06-10T09:40:00.000Z",
          "items": [
            {
              "variantId": 15,
              "sku": "CAM-M-ROJO",
              "productName": "Camisa Casual",
              "quantity": 2,
              "unitPrice": 49.90
            }
          ]
        }
      ]
    }
  ]
}
```

### GET /api/v1/admin/dashboard/kpis

Obtiene los indicadores clave de negocio (KPIs) acumulados para el panel de administración. Incluye las ventas del día (POS + e-commerce), conteo de pedidos de e-commerce pendientes, lista de productos/variantes con stock crítico y una comparativa de ventas del día por sucursal física.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard/kpis` | JWT `Bearer Token` | Permiso `sales:read` |

#### 2. Respuestas (Responses)

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "todaySales": {
      "total": 1550.50,
      "pos": 1000.00,
      "ecommerce": 550.50
    },
    "pendingOrdersCount": 3,
    "criticalStock": {
      "count": 2,
      "products": [
        {
          "sku": "CAM-M-ROJO",
          "productName": "Camisa Casual",
          "branchName": "Sede Miraflores",
          "currentStock": 2,
          "minStock": 5
        },
        {
          "sku": "PAN-L-NEGRO",
          "productName": "Pantalón Denim Negro",
          "branchName": "Sede San Isidro",
          "currentStock": 1,
          "minStock": 5
        }
      ]
    },
    "salesByBranch": [
      {
        "branchId": 1,
        "branchName": "Sede Miraflores",
        "totalSales": 600.00
      },
      {
        "branchId": 2,
        "branchName": "Sede San Isidro",
        "totalSales": 400.00
      }
    ]
  }
}
```

---

### GET /api/v1/receipts


Consulta de manera paginada y filtrada las ventas/comprobantes electrónicos emitidos en el sistema POS.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso / Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/receipts` | JWT `Bearer Token` | Permiso `sales:read` |

#### 2. Parámetros Query (Query Parameters)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `branchId` | `number` | No | ID de la sucursal emisora. |
| `type` | `string` | No | Tipo de comprobante (`cross-branch` \| `normal`). |
| `from` | `string` | No | Fecha de inicio de búsqueda (formato YYYY-MM-DD o ISO). |
| `to` | `string` | No | Fecha de fin de búsqueda (formato YYYY-MM-DD o ISO). |
| `page` | `number` | No | Número de página para la paginación (`default: 1`). |
| `limit` | `number` | No | Cantidad de elementos por página (`default: 10`). |

#### 3. Respuestas (Responses)

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "results": [
      {
        "orderId": 12,
        "status": "COMPLETED",
        "subtotal": 99.80,
        "discountTotal": 0.00,
        "total": 99.80,
        "isCrossBranch": true,
        "sourceBranch": {
          "id": 1,
          "name": "Sede Central"
        },
        "branch": {
          "id": 2,
          "name": "Sede San Isidro"
        },
        "createdAt": "2026-06-10T09:40:00.000Z",
        "seller": {
          "id": 5,
          "name": "Juan",
          "lastName": "Perez",
          "email": "juan.perez@e-commerce.com"
        },
        "client": {
          "id": 3,
          "name": "Carlos",
          "lastName": "Mendoza",
          "documentId": "45678912"
        }
      }
    ]
  }
}
```

---

## Wishlist (Favoritos) — HU-010

### GET /api/v1/wishlist

Retorna la lista de productos favoritos del usuario autenticado, ordenados del más reciente al más antiguo.

- **Permisos requeridos:** Solo requiere autenticación (`requireAuth`).
- **Response Success (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 3,
      "variantId": 12,
      "addedAt": "2026-06-05T12:00:00.000Z",
      "variant": {
        "id": 12,
        "sku": "TSHIRT-001",
        "price": "29.99",
        "product": {
          "id": 5,
          "name": "Camiseta Básica",
          "description": "Camiseta de algodón 100%",
          "images": [
            {
              "id": 1,
              "url": "https://example.com/image.jpg",
              "isMain": true
            }
          ]
        }
      }
    }
  ]
}
```

### POST /api/v1/wishlist/:variantId

Agrega o elimina una variante de producto (`variantId`) de la lista de favoritos del usuario autenticado (Toggle). Si ya existía, lo elimina. Si no existía, lo agrega.

- **Parámetros de ruta:**
  - `variantId` (number): ID de la variante de producto.
- **Permisos requeridos:** Solo requiere autenticación (`requireAuth`).
- **Response Success (200 OK):**
```json
{
  "success": true,
  "message": "Agregado a favoritos",
  "data": {
    "id": 2,
    "userId": 3,
    "variantId": 12,
    "addedAt": "2026-06-05T12:05:00.000Z"
  }
}
```

### DELETE /api/v1/wishlist/:variantId

Elimina una variante de producto específica de la lista de favoritos.

- **Parámetros de ruta:**
  - `variantId` (number): ID de la variante de producto.
- **Permisos requeridos:** Solo requiere autenticación (`requireAuth`).
- **Response Success (200 OK):**
```json
{
  "success": true,
  "message": "Eliminado de favoritos"
}
```

## E-commerce Public API

### GET /api/v1/ecommerce/products/search

Búsqueda predictiva y filtrado avanzado de productos para el portal público de e-commerce. Retorna productos activos paginados basados en un cursor.

- **Parámetros de consulta (Query Params):**
  - `q` (string, opcional): Término de búsqueda. Busca coincidencia parcial en nombre de producto, descripción, código base, nombre de categoría, nombre de marca, o SKU de variantes.
  - `categoryId` (number, opcional): ID de la categoría para filtrar.
  - `brandId` (number, opcional): ID de la marca para filtrar.
  - `gender` (string, opcional): Género de la prenda.
  - `minPrice` (number, opcional): Rango de precio mínimo de la variante.
  - `maxPrice` (number, opcional): Rango de precio máximo de la variante.
  - `branchId` (number, opcional): ID de la sucursal. Filtra la disponibilidad de stock a una sucursal específica.
  - `cursor` (number, opcional): Cursor de paginación. Si el ordenamiento es por precio (`price_asc`, `price_desc`), el cursor representa el `offset` (salto). Si es por relevancia/fecha (`newest`, `relevance`), el cursor representa el ID de producto.
  - `limit` (number, opcional, por defecto 10): Cantidad de productos a retornar por página.
  - `orderBy` (string, opcional, por defecto `relevance`): Criterio de ordenamiento. Opciones: `relevance`, `newest`, `price_asc`, `price_desc`.

- **Regla de Negocio de Precios y Stock:**
  - El filtro de precio (`minPrice`/`maxPrice`) evalúa si alguna variante activa del producto cae en el rango y tiene stock.
  - Si un producto no tiene stock en ninguna variante/sucursal (o en la sucursal especificada por `branchId`), se oculta y no es retornado.
  - Si el producto tiene al menos una variante con stock, el producto se devuelve junto con todas sus variantes activas. Las variantes sin stock se marcan con `outOfStock: true`.

- **Response Success (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "CAM",
      "name": "Camisa Casual",
      "description": "Una linda camisa",
      "categoryId": 2,
      "brandId": 1,
      "gender": "UNISEX",
      "isActive": true,
      "createdAt": "2026-06-24T00:00:00.000Z",
      "updatedAt": "2026-06-24T00:00:00.000Z",
      "category": {
        "id": 2,
        "name": "Camisas"
      },
      "brand": {
        "id": 1,
        "name": "E-Commerce"
      },
      "images": [
        {
          "id": 1,
          "productId": 1,
          "url": "https://example.com/camisa.jpg",
          "isMain": true
        }
      ],
      "variants": [
        {
          "id": 10,
          "productId": 1,
          "sku": "CAM-M-NEGRO",
          "price": 49.99,
          "attributesJson": {"talla": "M", "color": "NEGRO"},
          "isActive": true,
          "minStock": 5,
          "createdAt": "2026-06-24T00:00:00.000Z",
          "updatedAt": "2026-06-24T00:00:00.000Z",
          "stock": 5,
          "outOfStock": false
        },
        {
          "id": 11,
          "productId": 1,
          "sku": "CAM-S-NEGRO",
          "price": 49.99,
          "attributesJson": {"talla": "S", "color": "NEGRO"},
          "isActive": true,
          "minStock": 5,
          "createdAt": "2026-06-24T00:00:00.000Z",
          "updatedAt": "2026-06-24T00:00:00.000Z",
          "stock": 0,
          "outOfStock": true
        }
      ]
    }
  ],
  "pagination": {
    "nextCursor": "1"
  }
}

---

### GET /api/v1/ecommerce/products/:slug

Obtiene la ficha técnica detallada de un producto activo basado en su `slug` único para el portal público de e-commerce. Retorna el producto con sus imágenes, categoría, marca, y sus variantes activas junto con el stock disponible de la sucursal principal (`isMain = true`).

- **Parámetros de Ruta (Path Params):**
  - `slug` (string, requerido): El identificador URL único generado automáticamente para el producto.

- **Regla de Negocio de Stock:**
  - El stock devuelto para cada variante corresponde únicamente al disponible en la sucursal principal (`isMain = true`). Si no hay una sucursal explícitamente marcada como principal, se usará por defecto la primera sucursal activa.
  - Cada variante incluye un flag `outOfStock` calculado a partir del stock disponible en dicha sucursal principal.

- **Response Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "CAM",
    "name": "Camisa Casual",
    "slug": "camisa-casual-cam",
    "description": "Una linda camisa",
    "categoryId": 2,
    "brandId": 1,
    "gender": "UNISEX",
    "isActive": true,
    "createdAt": "2026-06-24T00:00:00.000Z",
    "updatedAt": "2026-06-24T00:00:00.000Z",
    "category": {
      "id": 2,
      "name": "Camisas"
    },
    "brand": {
      "id": 1,
      "name": "E-Commerce"
    },
    "images": [
      {
        "id": 1,
        "productId": 1,
        "url": "https://example.com/camisa.jpg",
        "isMain": true
      }
    ],
    "variants": [
      {
        "id": 10,
        "productId": 1,
        "sku": "CAM-M-NEGRO",
        "price": 49.99,
        "attributesJson": {"talla": "M", "color": "NEGRO"},
        "isActive": true,
        "minStock": 5,
        "createdAt": "2026-06-24T00:00:00.000Z",
        "updatedAt": "2026-06-24T00:00:00.000Z",
        "stock": 15,
        "outOfStock": false
      }
    ],
    "sizeGuideUrl": null
  }
}
```

- **Response Not Found (404 Not Found):**
```json
{
  "success": false,
  "error": "Producto no encontrado"
}
```
```

---

## Direcciones de Envío — HU-006

Este módulo permite al cliente autenticado autogestionar sus direcciones de envío para las compras en la tienda virtual. El sistema requiere que la primera dirección registrada sea la predeterminada (`isDefault = true`), no permite eliminar la única dirección del usuario, y si se elimina la dirección predeterminada teniendo otras registradas, la predeterminada pasará a ser automáticamente la más antigua que quede.

### GET /api/v1/addresses

Recupera la lista de todas las direcciones de envío registradas para el cliente autenticado, ordenadas con la dirección predeterminada primero, seguida por la fecha de creación de forma ascendente.

#### 1. Especificación del Endpoint

| Método | Ruta                 | Autenticación      | Rol Requerido         |
| :----- | :------------------- | :----------------- | :-------------------- |
| `GET`  | `/api/v1/addresses`  | JWT `Bearer Token` | Cualquier Autenticado |

#### 2. Cuerpo de la Petición (Request Body)

No requiere cuerpo de petición.

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 5,
      "alias": "Casa",
      "fullAddress": "Av. Larco 123, Dpto 402",
      "district": "Miraflores",
      "reference": "Frente al parque Kennedy",
      "isDefault": true,
      "createdAt": "2026-06-24T14:00:00.000Z",
      "updatedAt": "2026-06-24T14:00:00.000Z"
    },
    {
      "id": 2,
      "userId": 5,
      "alias": "Trabajo",
      "fullAddress": "Av. Javier Prado Este 456",
      "district": "San Isidro",
      "reference": "Edificio Capital",
      "isDefault": false,
      "createdAt": "2026-06-24T14:05:00.000Z",
      "updatedAt": "2026-06-24T14:05:00.000Z"
    }
  ]
}
```

##### Error de Autenticación (HTTP 401 Unauthorized)

```json
{
  "success": false,
  "error": "Acceso no autorizado: Contexto de seguridad faltante"
}
```

---

### POST /api/v1/addresses

Registra una nueva dirección de envío para el cliente autenticado.

#### 1. Especificación del Endpoint

| Método | Ruta                 | Autenticación      | Rol Requerido         |
| :----- | :------------------- | :----------------- | :-------------------- |
| `POST` | `/api/v1/addresses`  | JWT `Bearer Token` | Cualquier Autenticado |

#### 2. Cuerpo de la Petición (Request Body)

Se espera un objeto JSON con la siguiente estructura:

```json
{
  "alias": "Casa",
  "fullAddress": "Av. Larco 123, Dpto 402",
  "district": "Miraflores",
  "reference": "Frente al parque Kennedy",
  "isDefault": false
}
```

**Detalle de Campos:**

| Parámetro     | Tipo      | Requerido | Reglas de Validación                                                  |
| :------------ | :-------- | :-------- | :-------------------------------------------------------------------- |
| `alias`       | `string`  | Sí        | Mínimo 2 caracteres, máximo 50. Nombre identificador (ej: "Trabajo"). |
| `fullAddress` | `string`  | Sí        | Mínimo 5 caracteres. Dirección completa.                              |
| `district`    | `string`  | Sí        | Mínimo 2 caracteres. Nombre del distrito.                             |
| `reference`   | `string`  | No        | Referencias físicas opcionales del domicilio.                         |
| `isDefault`   | `boolean` | No        | Flag para indicar si es la dirección predeterminada.                  |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 201 Created)

```json
{
  "success": true,
  "message": "Dirección creada correctamente",
  "data": {
    "id": 1,
    "userId": 5,
    "alias": "Casa",
    "fullAddress": "Av. Larco 123, Dpto 402",
    "district": "Miraflores",
    "reference": "Frente al parque Kennedy",
    "isDefault": true,
    "createdAt": "2026-06-24T14:00:00.000Z",
    "updatedAt": "2026-06-24T14:00:00.000Z"
  }
}
```

##### Error de Validación (HTTP 400 Bad Request)

```json
{
  "success": false,
  "errors": [
    {
      "field": "alias",
      "message": "El alias debe tener al menos 2 caracteres"
    }
  ]
}
```

---

### PUT /api/v1/addresses/:id

Actualiza los datos de una dirección de envío existente que pertenece al cliente autenticado.

#### 1. Especificación del Endpoint

| Método | Ruta                     | Autenticación      | Rol Requerido         |
| :----- | :----------------------- | :----------------- | :-------------------- |
| `PUT`  | `/api/v1/addresses/:id`  | JWT `Bearer Token` | Cualquier Autenticado |

#### 2. Cuerpo de la Petición (Request Body)

Permite actualizar parcialmente o en su totalidad los campos de la dirección:

```json
{
  "alias": "Mi Nuevo Domicilio",
  "isDefault": true
}
```

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "message": "Dirección actualizada correctamente",
  "data": {
    "id": 1,
    "userId": 5,
    "alias": "Mi Nuevo Domicilio",
    "fullAddress": "Av. Larco 123, Dpto 402",
    "district": "Miraflores",
    "reference": "Frente al parque Kennedy",
    "isDefault": true,
    "createdAt": "2026-06-24T14:00:00.000Z",
    "updatedAt": "2026-06-24T14:10:00.000Z"
  }
}
```

##### Error de Validación o Negocio (HTTP 400 Bad Request)

- Intento de quitar `isDefault` a la dirección predeterminada sin haber asignado otra dirección como default:
```json
{
  "success": false,
  "error": "Debe marcar otra dirección como predeterminada en su lugar"
}
```

---

### DELETE /api/v1/addresses/:id

Elimina una dirección de envío del cliente autenticado.

#### 1. Especificación del Endpoint

| Método   | Ruta                     | Autenticación      | Rol Requerido         |
| :------- | :----------------------- | :----------------- | :-------------------- |
| `DELETE` | `/api/v1/addresses/:id`  | JWT `Bearer Token` | Cualquier Autenticado |

#### 2. Cuerpo de la Petición (Request Body)

No requiere cuerpo de petición.

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "message": "Dirección eliminada correctamente"
}
```

##### Error de Negocio (HTTP 400 Bad Request)

- Intento de eliminar la única dirección registrada por el usuario:
```json
{
  "success": false,
  "error": "No puede eliminar su única dirección"
}
```

##### Dirección No Encontrada (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "Dirección no encontrada"
}
```

---

## Blog y Posicionamiento SEO — HU-018

### GET /api/v1/blog

Obtiene la lista de todos los artículos de blog publicados (activos) cuya fecha de publicación sea menor o igual a la fecha actual (`publishedAt <= now()`).

#### 1. Especificación del Endpoint

| Método | Ruta            | Autenticación | Rol Requerido |
| :----- | :-------------- | :------------ | :------------ |
| `GET`  | `/api/v1/blog`  | Ninguna       | Público       |

#### 2. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Mi Primer Post",
      "slug": "mi-primer-post",
      "content": "<p>Contenido del post en HTML</p>",
      "status": "PUBLISHED",
      "metaTitle": "SEO Title",
      "metaDescription": "SEO Desc",
      "tags": ["seo", "marketing"],
      "publishedAt": "2026-06-24T14:00:00.000Z",
      "authorId": 1,
      "createdAt": "2026-06-24T14:00:00.000Z",
      "updatedAt": "2026-06-24T14:10:00.000Z",
      "author": {
        "name": "Administrador"
      }
    }
  ]
}
```

---

### GET /api/v1/blog/:slug

Obtiene un artículo de blog publicado a partir de su slug único. Cada consulta exitosa incrementa el contador de vistas (`views`) del artículo en 1 de forma atómica.

#### 1. Especificación del Endpoint

| Método | Ruta                  | Autenticación | Rol Requerido |
| :----- | :-------------------- | :------------ | :------------ |
| `GET`  | `/api/v1/blog/:slug`  | Ninguna       | Público       |

#### 2. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Mi Primer Post",
    "slug": "mi-primer-post",
    "content": "<p>Contenido del post en HTML</p>",
    "status": "PUBLISHED",
    "metaTitle": "SEO Title",
    "metaDescription": "SEO Desc",
    "tags": ["seo", "marketing"],
    "publishedAt": "2026-06-24T14:00:00.000Z",
    "views": 1,
    "authorId": 1,
    "createdAt": "2026-06-24T14:00:00.000Z",
    "updatedAt": "2026-06-24T14:10:00.000Z",
    "author": {
      "name": "Administrador"
    }
  }
}
```

##### No Encontrado (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "El artículo no existe o no está publicado"
}
```

---

### GET /api/v1/admin/blog

Obtiene todos los artículos de blog (incluyendo borradores) para su gestión en el panel administrativo.

#### 1. Especificación del Endpoint

| Método | Ruta                  | Autenticación      | Rol Requerido | Permiso Requerido |
| :----- | :-------------------- | :----------------- | :------------ | :---------------- |
| `GET`  | `/api/v1/admin/blog`  | JWT `Bearer Token` | `ADMIN`       | `roles:manage`    |

#### 2. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Mi Primer Post",
      "slug": "mi-primer-post",
      "content": "<p>Contenido del post en HTML</p>",
      "status": "DRAFT",
      "metaTitle": "SEO Title",
      "metaDescription": "SEO Desc",
      "authorId": 1,
      "createdAt": "2026-06-24T14:00:00.000Z",
      "updatedAt": "2026-06-24T14:10:00.000Z",
      "author": {
        "name": "Administrador"
      }
    }
  ]
}
```

---

### GET /api/v1/admin/blog/:id

Obtiene el detalle completo de un artículo de blog por su ID.

#### 1. Especificación del Endpoint

| Método | Ruta                      | Autenticación      | Rol Requerido | Permiso Requerido |
| :----- | :------------------------ | :----------------- | :------------ | :---------------- |
| `GET`  | `/api/v1/admin/blog/:id`  | JWT `Bearer Token` | `ADMIN`       | `roles:manage`    |

---

### POST /api/v1/admin/blog

Crea un nuevo artículo de blog. El slug se genera automáticamente de forma única a partir de un slugify del título.

#### 1. Especificación del Endpoint

| Método | Ruta                  | Autenticación      | Rol Requerido | Permiso Requerido |
| :----- | :-------------------- | :----------------- | :------------ | :---------------- |
| `POST` | `/api/v1/admin/blog`  | JWT `Bearer Token` | `ADMIN`       | `roles:manage`    |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "title": "Mi Primer Post",
  "content": "<p>Contenido detallado...</p>",
  "status": "DRAFT",
  "metaTitle": "Título SEO Opcional",
  "metaDescription": "Meta Descripción SEO Opcional",
  "tags": ["seo", "marketing"],
  "publishedAt": "2026-06-25T10:00:00.000Z"
}
```

---

### PATCH /api/v1/admin/blog/:id

Actualiza parcialmente un artículo de blog existente.

#### 1. Especificación del Endpoint

| Método  | Ruta                      | Autenticación      | Rol Requerido | Permiso Requerido |
| :------ | :------------------------ | :----------------- | :------------ | :---------------- |
| `PATCH` | `/api/v1/admin/blog/:id`  | JWT `Bearer Token` | `ADMIN`       | `roles:manage`    |

---

### DELETE /api/v1/admin/blog/:id

Elimina lógicamente un artículo de blog cambiando su estado a `ARCHIVED`.

#### 1. Especificación del Endpoint

| Método   | Ruta                      | Autenticación      | Rol Requerido | Permiso Requerido |
| :------- | :------------------------ | :----------------- | :------------ | :---------------- |
| `DELETE` | `/api/v1/admin/blog/:id`  | JWT `Bearer Token` | `ADMIN`       | `roles:manage`    |

---

## 10. Módulo de Checkout y Pagos (Stripe) — HU-043

### POST /api/v1/checkout/payment-intent

Crea un PaymentIntent en Stripe a partir del carrito y la dirección de envío del usuario autenticado.

#### 1. Especificación del Endpoint

| Método | Ruta                              | Autenticación      | Rol Requerido | Permiso Requerido |
| :----- | :-------------------------------- | :----------------- | :------------ | :---------------- |
| `POST` | `/api/v1/checkout/payment-intent` | JWT `Bearer Token` | Cualquiera    | Ninguno           |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "cartId": 2,
  "addressId": 5
}
```

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_123456_secret_7890abc"
  }
}
```

---

### POST /api/v1/checkout/webhook

Endpoint público que recibe eventos de Stripe (Webhooks). Procesa el evento `payment_intent.succeeded` de forma atómica para registrar la orden, decrementar stock de la variante en la sucursal principal, generar el Kardex de salida y vaciar el carrito.

#### 1. Especificación del Endpoint

| Método | Ruta                       | Autenticación     | Rol Requerido |
| :----- | :------------------------- | :---------------- | :------------ |
| `POST` | `/api/v1/checkout/webhook` | Ninguna (Público) | Stripe Agent  |

> [!IMPORTANT]
> Requiere incluir la cabecera `stripe-signature` enviada por Stripe para verificar la autenticidad del payload utilizando la clave secreta configurada.

#### 2. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "received": true,
  "processed": true,
  "orderId": 12
}
```

---

## 11. Módulo de Historial de Pedidos y Comprobantes (PDF) — HU-044

### GET /api/v1/orders

Obtiene la lista de pedidos del usuario autenticado de forma paginada y opcionalmente filtrada por estado.

#### 1. Especificación del Endpoint

| Método | Ruta              | Autenticación      | Rol Requerido | Permiso Requerido |
| :----- | :---------------- | :----------------- | :------------ | :---------------- |
| `GET`  | `/api/v1/orders`  | JWT `Bearer Token` | Cualquiera    | Ninguno           |

#### 2. Parámetros de Consulta (Query Params)

| Parámetro | Tipo     | Requerido | Valor por Defecto | Descripción                                                                                   |
| :-------- | :------- | :-------- | :---------------- | :-------------------------------------------------------------------------------------------- |
| `status`  | `string` | No        | N/A               | Filtra los pedidos por su estado (`PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`).   |
| `page`    | `number` | No        | `1`               | El número de página para la paginación (debe ser mayor a 0).                                  |
| `limit`   | `number` | No        | `10`              | El número de elementos por página (debe ser mayor a 0).                                       |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 12,
        "status": "PAID",
        "total": 115,
        "shippingCost": 15,
        "addressSnapshot": {
          "alias": "Casa",
          "fullAddress": "Av Larco 123",
          "district": "Miraflores",
          "reference": "Frente al parque"
        },
        "paymentIntentId": "pi_123456_secret_7890abc",
        "createdAt": "2026-06-25T12:00:00.000Z",
        "items": [
          {
            "id": 1,
            "variantId": 20,
            "qty": 2,
            "unitPrice": 50,
            "variantSku": "SKU-JEAN-M-BLUE",
            "productName": "Pantalón Jean Slim"
          }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### GET /api/v1/orders/:id/receipt/pdf

Genera y descarga el comprobante de pago en formato PDF del pedido especificado, devolviendo un stream eficiente.

#### 1. Especificación del Endpoint

| Método | Ruta                                  | Autenticación      | Rol Requerido | Permiso Requerido |
| :----- | :------------------------------------ | :----------------- | :------------ | :---------------- |
| `GET`  | `/api/v1/orders/:id/receipt/pdf`      | JWT `Bearer Token` | Cualquiera    | Ninguno           |

> [!IMPORTANT]
> Se valida estrictamente que la orden pertenezca al usuario autenticado (extraído de su JWT). De lo contrario, se retornará HTTP 403.

#### 2. Parámetros de Ruta (Path Params)

| Parámetro | Tipo     | Requerido | Descripción |
| :-------- | :------- | :-------- | :---------- |
| `id`      | `number` | Sí        | ID de la orden de la cual se desea descargar el comprobante. |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename=comprobante-pedido-12.pdf`
- **Body**: Stream de datos binarios del PDF.

##### No Autorizado (HTTP 403 Forbidden)

```json
{
  "success": false,
  "error": "No autorizado para ver este comprobante"
}
```

##### No Encontrado (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "Pedido no encontrado"
}
```

### PATCH /api/v1/admin/orders/:id/status

Actualiza el estado de un pedido y notifica automáticamente al cliente por correo electrónico vía Resend y vía WhatsApp. Adicionalmente, audita de forma transparente el cambio mediante una extensión de Prisma Client que escribe en la tabla `OrderStatusLog`. **Nota de Logística:** Si el estado cambia a `PAID`, el sistema automáticamente generará la lista de picking y la etiqueta de despacho para la orden.

#### 1. Especificación del Endpoint

| Método  | Ruta                                   | Autenticación      | Rol Requerido  | Permiso Requerido |
| :------ | :------------------------------------- | :----------------- | :------------- | :---------------- |
| `PATCH` | `/api/v1/admin/orders/:id/status`      | JWT `Bearer Token` | Administrador  | `roles:manage`    |

#### 2. Parámetros de Ruta (Path Params)

| Parámetro | Tipo     | Requerido | Descripción |
| :-------- | :------- | :-------- | :---------- |
| `id`      | `number` | Sí        | ID de la orden de la cual se desea actualizar el estado. |

#### 3. Cuerpo de la Petición (Request Body)

- **Content-Type**: `application/json`

```json
{
  "status": "SHIPPED"
}
```

*Valores válidos para `status`:* `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`.

#### 4. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "message": "Estado del pedido actualizado correctamente",
  "data": {
    "id": 10,
    "userId": 1,
    "status": "SHIPPED",
    "total": 115.00,
    "shippingCost": 15.00,
    "addressSnapshot": { "alias": "Casa", "fullAddress": "Av Larco 123", "district": "Miraflores" },
    "paymentIntentId": "pi_test_123",
    "createdAt": "2026-06-25T15:00:00.000Z",
    "updatedAt": "2026-06-25T15:45:00.000Z"
  }
}
```

##### Solicitud Incorrecta (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "Estado de pedido inválido. Los permitidos son: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED"
}
```

##### No Encontrado (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "Pedido no encontrado"
}
```

---

## Exportación de Reportes — HU-053

### GET /api/v1/reports/export

Permite exportar reportes de ventas, inventario y clientes en formatos estándar (PDF, Excel, CSV) con filtros de fecha.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/export` | JWT `Bearer Token` | `sales:read` |

#### 2. Parámetros Query (Query Parameters)

| Parámetro | Tipo | Requerido | Descripción | Valores Permitidos |
| :--- | :--- | :--- | :--- | :--- |
| `type` | String | Sí | Tipo de reporte a exportar | `sales`, `inventory`, `clients` |
| `format` | String | Sí | Formato de archivo a descargar | `pdf`, `excel`, `csv` |
| `from` | String | No | Fecha de inicio del rango (formato YYYY-MM-DD) | ej. `2026-06-01` |
| `to` | String | No | Fecha de fin del rango (formato YYYY-MM-DD) | ej. `2026-06-30` |

#### 3. Respuestas del Servidor

##### Exportación Exitosa (HTTP 200 OK)

Devuelve un flujo binario/plano con la cabecera correspondiente al formato:

*   **PDF (`format=pdf`)**:
    *   `Content-Type: application/pdf`
    *   `Content-Disposition: attachment; filename="reporte-sales-YYYY-MM-DD.pdf"`
*   **Excel (`format=excel`)**:
    *   `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    *   `Content-Disposition: attachment; filename="reporte-sales-YYYY-MM-DD.xlsx"`
*   **CSV (`format=csv`)**:
    *   `Content-Type: text/csv`
    *   `Content-Disposition: attachment; filename="reporte-sales-YYYY-MM-DD.csv"`

##### Solicitud Incorrecta (HTTP 400 Bad Request)

Se emite cuando algún parámetro requerido falta o no cumple con el formato (por ejemplo, fecha inválida).

```json
{
  "success": false,
  "error": [
    {
      "field": "type",
      "message": "El tipo de reporte debe ser 'sales', 'inventory' o 'clients'"
    }
  ]
}
```

##### Acceso Prohibido (HTTP 403 Forbidden)

Se emite cuando el usuario autenticado no cuenta con el permiso `sales:read`.

```json
{
  "success": false,
  "error": "Acceso denegado: Se requiere el permiso 'sales:read'"
}
```

---

## Reporte de Rentabilidad — HU-069

### GET /api/v1/admin/reports/profitability

Permite obtener la utilidad bruta y el margen de rentabilidad agrupado por marca o categoría para un rango de fechas.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/reports/profitability` | JWT `Bearer Token` | `sales:read` |

#### 2. Parámetros Query (Query Parameters)

| Parámetro | Tipo | Requerido | Descripción | Valores Permitidos |
| :--- | :--- | :--- | :--- | :--- |
| `groupBy` | String | Sí | Indica si se agrupa por marca o categoría | `brand`, `category` |
| `from` | String | No | Fecha de inicio del rango (formato YYYY-MM-DD) | ej. `2026-06-01` |
| `to` | String | No | Fecha de fin del rango (formato YYYY-MM-DD) | ej. `2026-06-30` |

#### 3. Respuestas del Servidor

##### Reporte Exitoso (HTTP 200 OK)

Devuelve la rentabilidad calculada y agrupada:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "name": "Nike",
        "totalQuantity": 15,
        "totalRevenue": 1500,
        "totalCost": 900,
        "grossProfit": 600,
        "profitMarginPercentage": 40
      }
    ],
    "totals": {
      "totalQuantity": 15,
      "totalRevenue": 1500,
      "totalCost": 900,
      "grossProfit": 600,
      "profitMarginPercentage": 40
    }
  }
}
```

##### Solicitud Incorrecta (HTTP 400 Bad Request)

Se emite cuando falta algún parámetro obligatorio o el formato es incorrecto.

```json
{
  "success": false,
  "error": [
    {
      "field": "groupBy",
      "message": "El parámetro groupBy debe ser 'brand' o 'category'"
    }
  ]
}
```

##### Acceso Prohibido (HTTP 403 Forbidden)

Se emite cuando el usuario autenticado no cuenta con el permiso `sales:read`.

```json
{
  "success": false,
  "error": "Acceso denegado: Se requiere el permiso 'sales:read'"
}
```

---

## Dashboard Financiero Consolidado Multi-canal — HU-070

### GET /api/v1/admin/reports/financial-dashboard

Permite obtener una consolidación de ingresos del Punto de Venta (POS) y del E-commerce, detallando comparativas con el período anterior del mismo tamaño y el desglose de ingresos por sucursal física e ingresos online.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/reports/financial-dashboard` | JWT `Bearer Token` | `sales:read` |

#### 2. Parámetros Query (Query Parameters)

| Parámetro | Tipo | Requerido | Descripción | Valores Permitidos |
| :--- | :--- | :--- | :--- | :--- |
| `from` | String | No | Fecha de inicio del rango (formato YYYY-MM-DD). Por defecto son los últimos 30 días. | ej. `2026-06-01` |
| `to` | String | No | Fecha de fin del rango (formato YYYY-MM-DD). Por defecto es hoy. | ej. `2026-06-30` |

#### 3. Respuestas del Servidor

##### Reporte Exitoso (HTTP 200 OK)

Devuelve el resumen consolidado financiero:

```json
{
  "success": true,
  "data": {
    "currentPeriod": {
      "totalRevenue": 2000,
      "posRevenue": 1500,
      "ecommerceRevenue": 500,
      "revenueByBranch": [
        {
          "branchId": 1,
          "branchName": "Sede Principal",
          "total": 1500
        },
        {
          "branchId": null,
          "branchName": "Venta Online",
          "total": 500
        }
      ]
    },
    "previousPeriod": {
      "totalRevenue": 1600,
      "posRevenue": 1200,
      "ecommerceRevenue": 400,
      "revenueByBranch": [
        {
          "branchId": 1,
          "branchName": "Sede Principal",
          "total": 1200
        },
        {
          "branchId": null,
          "branchName": "Venta Online",
          "total": 400
        }
      ]
    },
    "comparison": {
      "revenueDifference": 400,
      "revenuePercentageChange": 25
    }
  }
}
```

##### Solicitud Incorrecta (HTTP 400 Bad Request)

Se emite cuando el formato de alguna fecha es incorrecto.

```json
{
  "success": false,
  "error": [
    {
      "field": "from",
      "message": "La fecha \"from\" debe tener formato YYYY-MM-DD"
    }
  ]
}
```

##### Acceso Prohibido (HTTP 403 Forbidden)

Se emite cuando el usuario autenticado no cuenta con el permiso `sales:read`.

```json
{
  "success": false,
  "error": "Acceso denegado: Se requiere el permiso 'sales:read'"
}
```

---

## Registro de Gastos Operativos por Sucursal — HU-071

Este módulo permite realizar operaciones CRUD sobre los gastos operativos (fijos y variables) asociados a cada sucursal del sistema.

### POST /api/v1/admin/expenses

Registra un nuevo gasto operativo en el sistema asociado a una sucursal y al usuario creador (auditoría).

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/expenses` | JWT `Bearer Token` | `sales:write` |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "branchId": 1,
  "type": "FIXED",
  "description": "Pago de alquiler mensual de local principal",
  "amount": 2500.00,
  "date": "2026-07-02T10:00:00.000Z"
}
```

#### 3. Respuestas del Servidor

##### Registro Exitoso (HTTP 201 Created)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "branchId": 1,
    "type": "FIXED",
    "description": "Pago de alquiler mensual de local principal",
    "amount": 2500.00,
    "date": "2026-07-02T10:00:00.000Z",
    "userId": 1,
    "createdAt": "2026-07-02T11:20:00.000Z",
    "updatedAt": "2026-07-02T11:20:00.000Z"
  }
}
```

##### Error de Validación (HTTP 400 Bad Request)

Se emite cuando el monto es negativo, el tipo no es FIXED o VARIABLE, o faltan campos obligatorios.

```json
{
  "success": false,
  "error": "El monto del gasto operativo no puede ser negativo"
}
```

---

### GET /api/v1/admin/expenses

Obtiene el listado de gastos operativos registrados en el sistema, permitiendo filtrar por sucursal y rango de fechas.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/expenses` | JWT `Bearer Token` | `sales:read` |

#### 2. Parámetros Query (Query Parameters)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `branchId` | Número | No | Filtra los gastos por el ID de la sucursal. |
| `from` | String (Fecha) | No | Filtra gastos cuya fecha sea mayor o igual a la indicada. |
| `to` | String (Fecha) | No | Filtra gastos cuya fecha sea menor o igual a la indicada. |

#### 3. Respuestas del Servidor

##### Consulta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "branchId": 1,
      "type": "FIXED",
      "description": "Pago de alquiler mensual de local principal",
      "amount": 2500.00,
      "date": "2026-07-02T10:00:00.000Z",
      "userId": 1,
      "createdAt": "2026-07-02T11:20:00.000Z",
      "updatedAt": "2026-07-02T11:20:00.000Z"
    }
  ]
}
```

---

### PUT /api/v1/admin/expenses/:id

Actualiza parcialmente o totalmente un gasto operativo existente.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `PUT` | `/api/v1/admin/expenses/:id` | JWT `Bearer Token` | `sales:write` |

#### 2. Cuerpo de la Petición (Request Body)

Se aceptan modificaciones opcionales de `branchId`, `type`, `description`, `amount` y `date`.

```json
{
  "amount": 2600.00,
  "description": "Pago de alquiler mensual reajustado"
}
```

#### 3. Respuestas del Servidor

##### Actualización Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "branchId": 1,
    "type": "FIXED",
    "description": "Pago de alquiler mensual reajustado",
    "amount": 2600.00,
    "date": "2026-07-02T10:00:00.000Z",
    "userId": 1,
    "createdAt": "2026-07-02T11:20:00.000Z",
    "updatedAt": "2026-07-02T11:25:00.000Z"
  }
}
```

---

### DELETE /api/v1/admin/expenses/:id

Elimina un registro de gasto operativo del sistema.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `DELETE` | `/api/v1/admin/expenses/:id` | JWT `Bearer Token` | `sales:write` |

#### 3. Respuestas del Servidor

##### Eliminación Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "message": "Gasto operativo eliminado exitosamente"
}
```

---

## Conciliación de Transacciones — HU-073

### POST /api/v1/admin/reconcile/stripe

Realiza el cruce de transacciones de Stripe y órdenes persistidas en MariaDB para un periodo de fechas determinado, devolviendo las transacciones conciliadas (matched) y las discrepancias (unmatched: stripeOnly y dbOnly).

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido | Permiso Requerido |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/reconcile/stripe` | JWT `Bearer Token` | Administrador | `roles:manage` |

#### 2. Cuerpo de la Petición (Request Body)

- **Content-Type**: `application/json`

```json
{
  "from": "2026-06-01T00:00:00.000Z",
  "to": "2026-06-26T23:59:59.999Z"
}
```

*Nota: Ambas fechas deben ser cadenas de fecha ISO 8601 válidas, y `from` debe ser anterior o igual a `to`.*

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

Devuelve las listas de conciliaciones coincidentes (`matched`) y con discrepancia (`unmatched`).

```json
{
  "success": true,
  "data": {
    "matched": [
      {
        "stripePaymentIntentId": "pi_3M7t9zLkdIwHu7ix0yU2jKxR",
        "orderId": 1024,
        "stripeAmount": 150.00,
        "orderAmount": 150.00,
        "status": "MATCHED"
      },
      {
        "stripePaymentIntentId": "pi_3M7t9zLkdIwHu7ix0yU2jKxS",
        "orderId": 1025,
        "stripeAmount": 200.00,
        "orderAmount": 195.00,
        "status": "AMOUNT_MISMATCH"
      }
    ],
    "unmatched": {
      "stripeOnly": [
        {
          "id": "pi_3M7t9zLkdIwHu7ix0yU2jKxT",
          "amount": 75.00,
          "currency": "pen",
          "status": "succeeded",
          "createdAt": "2026-06-20T12:00:00.000Z"
        }
      ],
      "dbOnly": [
        {
          "id": 1026,
          "paymentIntentId": "pi_3M7t9zLkdIwHu7ix0yU2jKxU",
          "total": 50.00,
          "status": "PAID",
          "createdAt": "2026-06-21T10:30:00.000Z"
        }
      ]
    }
  }
}
```

##### Solicitud Incorrecta (HTTP 400 Bad Request)

Se emite cuando la validación de fechas o del body falla.

```json
{
  "success": false,
  "errors": [
    {
      "field": "from",
      "message": "La fecha 'from' debe ser anterior o igual a la fecha 'to'"
    }
  ]
}
```

##### Acceso Prohibido (HTTP 403 Forbidden)

Se emite cuando el usuario no tiene la sesión activa o carece del permiso `roles:manage`.

```json
{
  "success": false,
  "error": "Acceso denegado: Se requiere el permiso 'roles:manage'"
}
```

## Logística y Despachos — HU-058

### GET /api/v1/logistics/orders/pending

Lista todas las órdenes en estado `PAID` que no tienen ningún despacho (`Delivery`) asociado.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/logistics/orders/pending` | Requerida (Bearer Token) | `ADMIN` o `SUPPLY` |

#### 2. Parámetros de Solicitud

No requiere parámetros.

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 101,
      "orderId": 101,
      "customerName": "Juan Pérez",
      "itemsCount": 3,
      "totalAmount": 150.00,
      "status": "PAID",
      "createdAt": "2026-07-01T10:00:00.000Z"
    }
  ]
}
```

---

### POST /api/v1/logistics/picking

Genera una lista de picking agrupando todas las órdenes (o una lista específica) que tienen estado `PAID` y que no cuentan con un despacho (`Delivery`) asociado.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/logistics/picking` | Requerida (Bearer Token) | `ADMIN` o `SUPPLY` |

#### 2. Parámetros de Solicitud

- **Cuerpo (JSON) - Opcional**:
  - `orderIds` (Array de Numbers, Opcional): Lista de IDs de órdenes a procesar. Si no se envía o está vacío, se procesan todas las órdenes con estado `PAID` sin despacho asociado (picking masivo).

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 201 Created)

Devuelve la lista de despachos (`Delivery`) creados, cada uno incluyendo sus correspondientes ítems de picking (`PickingItem`).

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "orderId": 101,
      "deliveryManId": null,
      "status": "PENDING",
      "createdAt": "2026-07-01T10:00:00.000Z",
      "updatedAt": "2026-07-01T10:00:00.000Z",
      "pickingItems": [
        {
          "id": 1,
          "deliveryId": 1,
          "variantId": 5,
          "qty": 2,
          "pickedAt": null,
          "variantSku": "SKU-PROD-M-RED",
          "productName": "Camiseta Básica"
        }
      ]
    }
  ]
}
```

##### Acceso Prohibido (HTTP 403 Forbidden)

```json
{
  "success": false,
  "error": "Acceso denegado: Se requiere el rol de Admin o Abastecimiento"
}
```

---

### POST /api/v1/logistics/deliveries/:id/assign

Asigna un repartidor (`deliveryManId`) a un despacho (`Delivery`) existente y actualiza su estado a `ASSIGNED`.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/logistics/deliveries/:id/assign` | Requerida (Bearer Token) | `ADMIN` o `SUPPLY` |

#### 2. Parámetros de Solicitud

- **Cuerpo (JSON)**:
  - `deliveryManId` (Number, Obligatorio): ID del usuario que tiene el rol `DELIVERY`.

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": 101,
    "deliveryManId": 99,
    "status": "ASSIGNED",
    "createdAt": "2026-07-01T10:00:00.000Z",
    "updatedAt": "2026-07-01T10:05:00.000Z"
  }
}
```

##### Solicitud Incorrecta (HTTP 400 Bad Request)

Se emite cuando el usuario a asignar no posee el rol `DELIVERY`.

```json
{
  "success": false,
  "error": "User does not have the DELIVERY role"
}
```

---

### GET /api/v1/logistics/deliveries/:id/label

Genera y descarga la etiqueta de despacho en formato PDF utilizando PDFKit.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/logistics/deliveries/:id/label` | Requerida (Bearer Token) | `ADMIN` o `SUPPLY` |

#### 2. Parámetros de Solicitud

- **URL (Params)**:
  - `id` (Number, Obligatorio): ID del despacho (`Delivery`).

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 200 OK)

Retorna un archivo binario PDF con cabecera `Content-Type: application/pdf` y `Content-Disposition: attachment; filename="shipping-label-:id.pdf"`.

```

---

### GET /api/v1/logistics/deliveries

Consulta todos los despachos generados en la base de datos, con la opción de filtrar por estado.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/logistics/deliveries` | Requerida (Bearer Token) | `ADMIN` o `SUPPLY` |

#### 2. Parámetros de Solicitud

- **Query Params (Opcionales)**:
  - `status` (String, Opcional): Filtrar por estado de despacho (PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED).

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "orderId": 101,
      "deliveryManId": null,
      "status": "PENDING",
      "createdAt": "2026-07-01T10:00:00.000Z",
      "updatedAt": "2026-07-01T10:00:00.000Z",
      "pickingItems": [
        {
          "id": 1,
          "deliveryId": 1,
          "variantId": 5,
          "qty": 2,
          "pickedAt": null,
          "variantSku": "SKU-PROD-M-RED",
          "productName": "Camiseta Básica"
        }
      ]
    }
  ]
}
```

---

### GET /api/v1/logistics/delivery-men

Consulta y retorna todos los usuarios del sistema que cuentan con el rol `DELIVERY`. Utilizado para popular el dropdown de asignación de repartidores en el frontend.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/logistics/delivery-men` | Requerida (Bearer Token) | `ADMIN` o `SUPPLY` |

#### 2. Parámetros de Solicitud

No requiere parámetros.

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 99,
      "name": "Juan Repartidor",
      "email": "juan.repartidor@example.com"
    },
    {
      "id": 100,
      "name": "Maria Envíos",
      "email": "maria.envios@example.com"
    }
  ]
}
```

---

### PATCH /api/v1/logistics/deliveries/:id/status

Actualiza el estado de un envío (Delivery) siguiendo el ciclo de vida estricto y envía notificaciones por correo al cliente.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/api/v1/logistics/deliveries/:id/status` | Requerida (Bearer Token) | `ADMIN` o `SUPPLY` |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "status": "IN_TRANSIT"
}
```

**Transiciones Válidas:**
- `PENDING` -> `ASSIGNED` o `CANCELLED`
- `ASSIGNED` -> `IN_TRANSIT` o `CANCELLED`
- `IN_TRANSIT` -> `DELIVERED` o `FAILED`
- `FAILED` -> `RETURNED`

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": 101,
    "deliveryManId": 99,
    "status": "IN_TRANSIT",
    "updatedAt": "2026-07-01T12:00:00.000Z"
  }
}
```

##### Conflicto / Transición Inválida (HTTP 409 Conflict)

```json
{
  "success": false,
  "error": "No se permite la transición de estado del envío de PENDING a IN_TRANSIT."
}
```

---

## Devoluciones y Logística Inversa — HU-065

Este módulo permite a los clientes solicitar devoluciones de sus pedidos entregados y a los administradores procesarlas.

### POST /api/v1/returns

Permite a un cliente solicitar la devolución de uno o más ítems de un pedido que se encuentra en estado `DELIVERED`.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/returns` | Requerida (Bearer Token) | `CLIENT` o cualquier autenticado |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "orderId": 10,
  "reason": "La talla es demasiado pequeña",
  "refundType": "CREDIT_NOTE",
  "items": [
    {
      "orderItemId": 1,
      "qty": 1
    }
  ]
}
```

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 201 Created)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": 10,
    "userId": 2,
    "reason": "La talla es demasiado pequeña",
    "status": "PENDING",
    "refundType": "CREDIT_NOTE",
    "createdAt": "2026-07-02T02:00:00.000Z",
    "updatedAt": "2026-07-02T02:00:00.000Z",
    "items": [
      {
        "id": 1,
        "returnRequestId": 1,
        "orderItemId": 1,
        "qty": 1
      }
    ]
  }
}
```

---

### PATCH /api/v1/admin/returns/:id/approve

Permite a un administrador aprobar una solicitud de devolución pendiente.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/api/v1/admin/returns/:id/approve` | Requerida (Bearer Token) | `ADMIN` |

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "APPROVED",
    "pickupOrderId": 5,
    "updatedAt": "2026-07-02T02:05:00.000Z"
  }
}
```

---

### PATCH /api/v1/admin/returns/:id/reject

Permite a un administrador rechazar una solicitud de devolución pendiente.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/api/v1/admin/returns/:id/reject` | Requerida (Bearer Token) | `ADMIN` |

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "REJECTED",
    "updatedAt": "2026-07-02T02:05:00.000Z"
  }
}
```

---

### POST /api/v1/admin/returns/:id/credit-note

Permite a un administrador emitir una nota de crédito o vale de crédito por una solicitud de devolución. El proceso realiza automáticamente la reversión del stock e ingresa la entrada en el Kardex. Finalmente, despacha el correo al cliente con el PDF adjunto de la nota de crédito.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/returns/:id/credit-note` | Requerida (Bearer Token) | `ADMIN` |

#### 2. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 201 Created)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "returnRequestId": 10,
    "amount": 31.00,
    "type": "CREDIT_NOTE",
    "code": "NC-1719899157291-4567",
    "usedAt": null,
    "createdAt": "2026-07-02T05:45:00.000Z",
    "updatedAt": "2026-07-02T05:45:00.000Z"
  }
}
```

##### Errores Comunes

- **HTTP 400 Bad Request**: Si la devolución no existe, ya cuenta con una nota de crédito emitida, o el monto calculado es menor o igual a cero.
- **HTTP 403 Forbidden**: Si el usuario no tiene el rol de administrador.


---

## Control de Cuentas por Cobrar y Créditos — HU-072

### POST /api/v1/credits

Registra un nuevo crédito otorgado a un cliente.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/credits` | Ninguna | Cualquiera |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "clientId": 1,
  "totalAmount": 500.00,
  "installments": 3,
  "dueDate": "2026-08-01T00:00:00.000Z"
}
```

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 201 Created)

```json
{
  "id": "credit-uuid-1",
  "clientId": 1,
  "totalAmount": 500.00,
  "installments": 3,
  "dueDate": "2026-08-01T00:00:00.000Z",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z",
  "payments": []
}
```

---

### POST /api/v1/credits/:id/payments

Registra un abono o pago parcial a un crédito existente.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/credits/:id/payments` | Ninguna | Cualquiera |

#### 2. Cuerpo de la Petición (Request Body)

```json
{
  "amount": 150.00
}
```

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 201 Created)

```json
{
  "id": "payment-uuid-1",
  "creditId": "credit-uuid-1",
  "amount": 150.00,
  "paidAt": "2026-07-02T12:05:00.000Z"
}
```

---

### GET /api/v1/credits

Consulta el saldo pendiente consolidado y el detalle de créditos de un cliente específico.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/credits?clientId=1` | Ninguna | Cualquiera |

#### 2. Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `clientId` | `number` | Sí | ID del cliente a consultar. |

#### 3. Respuestas del Servidor

##### Respuesta Exitosa (HTTP 200 OK)

```json
{
  "clientId": 1,
  "totalPendingBalance": 350.00,
  "credits": [
    {
      "id": "credit-uuid-1",
      "totalAmount": 500.00,
      "pendingBalance": 350.00,
      "dueDate": "2026-08-01T00:00:00.000Z",
      "installments": 3
    }
  ]
}
```

## Reporte de Productos con Baja Rotación — HU-074

### GET /api/v1/admin/reports/low-rotation

Consulta productos sin movimientos de salida en el Kardex durante el periodo configurado y calcula la cantidad de días sin movimiento.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido | Permiso Requerido |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/reports/low-rotation` | Requerida | Administrador | `products:read` |

#### 2. Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Default | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `days` | `number` | Opcional | 90 | Cantidad de días hacia atrás a evaluar para la baja rotación. |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "variantId": "12",
      "sku": "CAM-001-M-BLA",
      "productName": "Camisa Casual",
      "attributes": {
        "Talla": "M",
        "Color": "Blanco"
      },
      "daysWithoutMovement": 105,
      "lastMovementDate": "2025-10-15T00:00:00.000Z",
      "currentStock": 25
    }
  ]
}
```

## Gestión de Suscriptores al Newsletter — HU-088

### POST /api/v1/newsletter/subscribe

Permite suscribir un correo electrónico al boletín informativo (Newsletter). Si el correo ya existía y estaba inactivo, se reactiva de manera automática. Este endpoint es público.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/newsletter/subscribe` | Ninguna (Público) | Cualquiera |

#### 2. Cuerpo de la Petición (Request Body)

Se espera un objeto JSON con la siguiente estructura:

```json
{
  "email": "correo@ejemplo.com"
}
```

**Detalle de Campos:**

| Parámetro | Tipo | Requerido | Reglas de Validación |
| :--- | :--- | :--- | :--- |
| `email` | `string` | Sí | Formato de correo electrónico válido. |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "correo@ejemplo.com",
    "isActive": true,
    "subscribedAt": "2026-07-06T14:00:00.000Z"
  }
}
```

---

### DELETE /api/v1/newsletter/unsubscribe

Permite cancelar la suscripción de un correo electrónico del boletín informativo (Newsletter). El endpoint es público y el correo puede ser enviado tanto en el cuerpo de la petición como en los query parameters.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| `DELETE` | `/api/v1/newsletter/unsubscribe` | Ninguna (Público) | Cualquiera |

#### 2. Cuerpo de la Petición o Query Params (Request Body / Query Params)

Se puede enviar como JSON en el Body:

```json
{
  "email": "correo@ejemplo.com"
}
```

O como Query Parameter:
`DELETE /api/v1/newsletter/unsubscribe?email=correo@ejemplo.com`

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "correo@ejemplo.com",
    "isActive": false,
    "subscribedAt": "2026-07-06T14:00:00.000Z"
  }
}
```

##### Error: Correo no suscrito (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "Subscriber not found"
}
```

### GET /api/v1/admin/newsletter/subscribers

Permite consultar la lista de suscriptores al newsletter (activos) con paginación básica. Este endpoint está protegido y reservado para administradores.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| \`GET\` | \`/api/v1/admin/newsletter/subscribers\` | JWT \`Bearer Token\` | \`ADMIN\` |

#### 2. Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| \`page\` | \`number\` | No | Número de página (default: 1). |
| \`limit\` | \`number\` | No | Límite por página (default: 10). |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "correo@ejemplo.com",
      "isActive": true,
      "subscribedAt": "2026-07-06T14:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
\`\`\`

---

### GET /api/v1/admin/newsletter/subscribers/export

Genera y descarga un reporte exportable de todos los suscriptores activos del sistema, en formato CSV o Excel.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Rol Requerido |
| :--- | :--- | :--- | :--- |
| \`GET\` | \`/api/v1/admin/newsletter/subscribers/export\` | JWT \`Bearer Token\` | \`ADMIN\` |

#### 2. Query Parameters

| Parámetro | Tipo | Requerido | Descripción | Valores Permitidos |
| :--- | :--- | :--- | :--- | :--- |
| \`format\` | \`string\` | No | Formato de descarga (default: csv). | \`csv\`, \`excel\` |

#### 3. Respuestas (Responses)

##### Éxito (HTTP 200 OK)

Retorna un _stream_ del archivo directamente al cliente, forzando la descarga mediante el header \`Content-Disposition\`.

- **Para CSV:**
  - \`Content-Type\`: \`text/csv; charset=utf-8\`
  - \`Content-Disposition\`: \`attachment; filename="newsletter_subscribers_<timestamp>.csv"\`
- **Para Excel:**
  - \`Content-Type\`: \`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\`
  - \`Content-Disposition\`: \`attachment; filename="newsletter_subscribers_<timestamp>.xlsx"\`

---

## Historial de Comunicaciones al Cliente — HU-089

### GET /api/v1/admin/clients/:id/communications

Recupera el historial de todas las notificaciones y mensajes (Emails, WhatsApp) enviados a un cliente específico. Las comunicaciones se registran automáticamente usando el patrón Decorator sobre los servicios de envío (`Resend` y `Factiliza`).

#### 1. Especificación del Endpoint
- **Método:** GET
- **Ruta:** `/api/v1/admin/clients/:id/communications`
- **Permisos requeridos:** `users:read` (Bearer Token)
- **Rate Limiting:** Global (100 req / 15 min)

#### 2. Parámetros de Ruta (Path Parameters)
| Nombre | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `number` | ID del cliente a consultar |

#### 3. Respuestas Esperadas

**200 OK - Éxito:**
```json
{
  "success": true,
  "data": [
    {
      "id": 105,
      "userId": 42,
      "channel": "EMAIL",
      "subject": "Tu pedido #ORD-2026-0001 ha sido confirmado",
      "type": "SYSTEM",
      "sentAt": "2026-07-06T14:30:00.000Z"
    },
    {
      "id": 101,
      "userId": 42,
      "channel": "WHATSAPP",
      "subject": "Template: welcome_message",
      "type": "NOTIFICATION",
      "sentAt": "2026-06-25T10:15:00.000Z"
    }
  ]
}
```

**400 Bad Request - ID inválido:**
```json
{
  "success": false,
  "message": "Invalid client ID"
}
```

**401 Unauthorized - Token faltante o inválido:**
```json
{
  "success": false,
  "message": "No se proporcionó un token de autenticación"
}
```

**403 Forbidden - Sin permisos:**
```json
{
  "success": false,
  "message": "No tienes permiso para realizar esta acción"
}
```

---

## Modelo de Predicción de Demanda y Sugerencias de Abastecimiento — HU-091

### GET /api/v1/admin/reports/demand-forecast

Calcula la demanda proyectada por categoría y talla usando el promedio móvil de los asientos Kardex de tipo `SALIDA` históricos en el período configurado.

#### 1. Especificación del Endpoint
- **Método:** GET
- **Ruta:** `/api/v1/admin/reports/demand-forecast`
- **Permisos requeridos:** `products:read` (Bearer Token)
- **Rate Limiting:** Global (100 req / 15 min)

#### 2. Parámetros de Consulta (Query Parameters)
| Nombre | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `months` | `number` | No (default: 1) | Número de meses históricos a considerar para el promedio móvil. Debe ser mayor o igual a 1. |

#### 3. Respuestas Esperadas

**200 OK - Éxito:**
```json
{
  "success": true,
  "data": [
    {
      "categoryName": "Polos",
      "size": "M",
      "projectedDemand": 7.5
    },
    {
      "categoryName": "Jeans",
      "size": "32",
      "projectedDemand": 10.0
    }
  ]
}
```

---

### GET /api/v1/admin/reports/restock-suggestions

Cruza la demanda proyectada por variante con el stock actual de `BranchStock` (AVAILABLE) para emitir sugerencias de abastecimiento.

#### 1. Especificación del Endpoint
- **Método:** GET
- **Ruta:** `/api/v1/admin/reports/restock-suggestions`
- **Permisos requeridos:** `products:read` (Bearer Token)
- **Rate Limiting:** Global (100 req / 15 min)

#### 2. Parámetros de Consulta (Query Parameters)
| Nombre | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `months` | `number` | No (default: 1) | Número de meses históricos para calcular la demanda del reabastecimiento. |

#### 3. Respuestas Esperadas

**200 OK - Éxito:**
```json
{
  "success": true,
  "data": [
    {
      "variantId": 1,
      "suggestedQty": 8.0,
      "currentStock": 2.0
    },
    {
      "variantId": 2,
      "suggestedQty": 1.0,
      "currentStock": 4.0
    },
    {
      "variantId": 3,
      "suggestedQty": 0.0,
      "currentStock": 25.0
    }
  ]
}
```

---

## Admin Loyalty Config

### 1. Obtener Configuración de Lealtad
- **URL**: `/api/v1/admin/loyalty-config`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer ADMIN_TOKEN`
- **Success Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "solesPerPoint": "100.00",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 2. Actualizar Configuración de Lealtad
- **URL**: `/api/v1/admin/loyalty-config`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer ADMIN_TOKEN`
- **Body**:
```json
{
  "solesPerPoint": 5
}
```
- **Success Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "solesPerPoint": "5",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## Módulo Administración de Backup (RSK-002)

### GET /api/v1/admin/backup-config

Obtiene la configuración actual del servicio de backups automáticos.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/backup-config` | JWT `Bearer Token` | Rol `ADMIN` o `SUPERADMIN` |

#### 2. Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "retentionDays": 7,
    "adminEmail": "admin@e-commerce.com",
    "cronExpression": "0 0 * * *",
    "createdAt": "2026-07-13T00:00:00.000Z",
    "updatedAt": "2026-07-13T00:00:00.000Z"
  }
}
```

#### 3. Errores

| Código HTTP | Motivo |
| :--- | :--- |
| `401` | Token JWT ausente o inválido |
| `403` | Rol insuficiente (requiere ADMIN o SUPERADMIN) |
| `500` | Error interno del servidor |

---

### PUT /api/v1/admin/backup-config

Actualiza la configuración del servicio de backups. Cambios en `cronExpression` requieren reconstruir el contenedor `db-backup` para tomar efecto.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `PUT` | `/api/v1/admin/backup-config` | JWT `Bearer Token` | Rol `ADMIN` o `SUPERADMIN` |

#### 2. Cuerpo de la Solicitud

```json
{
  "retentionDays": 14,
  "adminEmail": "tecnico@e-commerce.com",
  "cronExpression": "0 2 * * *"
}
```

Todos los campos son opcionales; solo se actualizan los proporcionados.

#### 3. Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "retentionDays": 14,
    "adminEmail": "tecnico@e-commerce.com",
    "cronExpression": "0 2 * * *",
    "createdAt": "2026-07-13T00:00:00.000Z",
    "updatedAt": "2026-07-13T10:00:00.000Z"
  }
}
```

#### 4. Errores

| Código HTTP | Motivo |
| :--- | :--- |
| `400` | `retentionDays` menor a 1 |
| `401` | Token JWT ausente o inválido |
| `403` | Rol insuficiente |
| `500` | Error interno del servidor |

---

### POST /api/v1/admin/backup-config/notify-failure

**Uso interno.** Llamado por el script `backup.sh` cuando `mysqldump` falla. Envía un correo de alerta al `adminEmail` configurado.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/backup-config/notify-failure` | Header `x-backup-secret` | Secreto interno compartido |

#### 2. Cuerpo de la Solicitud

```json
{
  "database": "app_db",
  "host": "database",
  "date": "20260713_000001"
}
```

#### 3. Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "message": "Notificación enviada"
}
```

#### 4. Errores

| Código HTTP | Motivo |
| :--- | :--- |
| `401` | Header `x-backup-secret` ausente o incorrecto |
| `500` | Error interno al enviar el email |

---

## Kardex Automatizado y Método de Valorización — HU-026

Este módulo expone el historial contable de movimientos de inventario (Kardex) y permite configurar el método de valorización de costos (Costo Promedio Ponderado o PEPS/FIFO) que utilizará el sistema al registrar salidas de stock.

### GET /api/v1/kardex

Retorna los asientos del Kardex para una variante y sucursal específicas. Soporta filtros opcionales por fecha y tipo de movimiento.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/kardex` | JWT `Bearer Token` | `inventory:read` |

#### 2. Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `variantId` | `number` | Sí | ID de la variante de producto a consultar |
| `branchId` | `number` | Sí | ID de la sucursal a consultar |
| `from` | `string (ISO 8601)` | No | Fecha/hora de inicio del rango. Ejemplo: `2026-01-01T00:00:00.000Z` |
| `to` | `string (ISO 8601)` | No | Fecha/hora de fin del rango. Ejemplo: `2026-12-31T23:59:59.999Z` |
| `type` | `string` | No | Filtra por tipo de movimiento. Valores válidos: `COMPRA`, `VENTA`, `TRANSFERENCIA`, `DEVOLUCION`, `AJUSTE` |

#### 3. Respuestas (Responses)

##### Consulta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "COMPRA",
      "quantity": 50,
      "unitCost": 100.00,
      "balanceQty": 50,
      "balanceCost": 5000.00,
      "sku": "CAMISA-M-AZUL",
      "branch": "Sucursal Principal",
      "createdAt": "2026-06-01T10:00:00.000Z"
    },
    {
      "id": 2,
      "type": "VENTA",
      "quantity": 5,
      "unitCost": 100.00,
      "balanceQty": 45,
      "balanceCost": 4500.00,
      "sku": "CAMISA-M-AZUL",
      "branch": "Sucursal Principal",
      "createdAt": "2026-06-03T15:30:00.000Z"
    }
  ]
}
```

##### Parámetro inválido (HTTP 400 Bad Request)

Retornado cuando `variantId` o `branchId` no son enteros positivos, las fechas no son ISO 8601 válidas, o `type` no es uno de los valores permitidos.

```json
{
  "success": false,
  "error": [
    {
      "code": "invalid_enum_value",
      "path": ["type"],
      "message": "Invalid enum value. Expected 'COMPRA' | 'VENTA' | 'TRANSFERENCIA' | 'DEVOLUCION' | 'AJUSTE', received 'INVALIDO'"
    }
  ]
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token o es inválido.
- **HTTP 403 Forbidden**: Si el usuario carece del permiso `inventory:read`.

#### 4. Tipos de Movimiento (KardexType)

| Valor | Origen |
| :--- | :--- |
| `COMPRA` | Ingreso de mercadería desde un proveedor (`POST /api/v1/stock/entries`) |
| `VENTA` | Venta POS, venta Cross-Branch confirmada, o pedido e-commerce |
| `TRANSFERENCIA` | Transferencia interna entre sucursales (`POST /api/v1/stock-transfers`) |
| `DEVOLUCION` | Devolución de cliente, nota de crédito, o cancelación de venta |
| `AJUSTE` | Ajuste de inventario físico (`POST /api/v1/stock/adjustments`) |

---

### GET /api/v1/admin/inventory-settings

Retorna la configuración activa del método de valorización de costos de inventario.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/inventory-settings` | JWT `Bearer Token` | `admin:read` |

#### 2. Respuestas (Responses)

##### Consulta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "valuationMethod": "PROMEDIO_PONDERADO"
  }
}
```

Los posibles valores de `valuationMethod` son:

| Valor | Descripción |
| :--- | :--- |
| `PROMEDIO_PONDERADO` | Costo Promedio Ponderado (CPP). Lee el `unitCost` del último asiento Kardex de la variante |
| `PEPS` | Primeras Entradas, Primeras Salidas (FIFO). Calcula el costo promedio ponderado de los lotes más antiguos que cubren la cantidad vendida |

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token o es inválido.
- **HTTP 403 Forbidden**: Si el usuario carece del permiso `admin:read`.

---

### PUT /api/v1/admin/inventory-settings

Actualiza el método de valorización de costos. El cambio aplica a todos los movimientos de salida registrados a partir de ese momento; los asientos históricos no se recalculan.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `PUT` | `/api/v1/admin/inventory-settings` | JWT `Bearer Token` | `admin:write` |

#### 2. Cuerpo de la Solicitud (Request Body)

```json
{
  "valuationMethod": "PEPS"
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `valuationMethod` | `string` | Sí | Método de valorización. Valores válidos: `PROMEDIO_PONDERADO`, `PEPS` |

#### 3. Respuestas (Responses)

##### Actualización Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "valuationMethod": "PEPS"
  }
}
```

##### Valor inválido (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": [
    {
      "code": "invalid_enum_value",
      "path": ["valuationMethod"],
      "message": "Invalid enum value. Expected 'PROMEDIO_PONDERADO' | 'PEPS', received 'LIFO'"
    }
  ]
}
```

##### Acceso Denegado (HTTP 401 / 403)

- **HTTP 401 Unauthorized**: Si falta el Token o es inválido.
- **HTTP 403 Forbidden**: Si el usuario carece del permiso `admin:write`.

---

## Módulo Productos (HU-014)

### GET /api/v1/products/:id/price-history

Obtiene el historial estructurado de cambios de precio del producto/variante, indicando el usuario responsable, la fecha/hora y los valores anterior y nuevo.

#### 1. Especificación del Endpoint

| Método | Ruta | Autenticación | Permiso Requerido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/products/:id/price-history` | JWT `Bearer Token` | `products:read` |

#### 2. Parámetros de Ruta (Path Params)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `number` | Sí | ID del producto padre para el cual obtener el historial de precios |

#### 3. Respuesta Exitosa (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "variantId": 15,
      "userId": 1,
      "oldPrice": 100,
      "newPrice": 120,
      "createdAt": "2026-07-13T10:00:00.000Z",
      "user": {
        "id": 1,
        "name": "Carlos Perez",
        "email": "user1@e-commerce.com"
      }
    }
  ]
}
```

