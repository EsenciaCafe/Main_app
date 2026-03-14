# PRD - Esencia Mini Pancakes & Coffee - App de Fidelización

## Resumen
App móvil de fidelización para el café "Esencia Mini Pancakes & Coffee". Los clientes acumulan puntos, canjean recompensas y reciben promociones desde su móvil.

## Stack Técnico
- **Frontend**: Expo React Native (SDK 54), expo-router, TypeScript
- **Backend**: FastAPI (Python), Motor (async MongoDB driver)
- **Base de datos**: MongoDB
- **Autenticación**: JWT (email/contraseña)

## Funcionalidades Implementadas

### Cliente
- [x] Registro e inicio de sesión (JWT)
- [x] Dashboard con balance de puntos y preview de promociones
- [x] Lista de promociones activas con barra de progreso
- [x] Canje de recompensas (genera código único)
- [x] Código QR para identificación en el local
- [x] Historial de puntos y canjes
- [x] Perfil con información y canjes recientes

### Administración
- [x] Panel de administración (solo para admins)
- [x] Estadísticas (clientes, puntos dados, canjes, pendientes)
- [x] Buscar y agregar puntos a clientes
- [x] Escanear/identificar clientes por ID
- [x] Gestionar promociones (crear, desactivar)
- [x] Validar canjes pendientes

## Credenciales de Prueba
- **Admin**: admin@esencia.com / admin123
- **Cliente demo**: cliente@test.com / test123 (15 puntos)

## Diseño
- Estética minimalista con tonos beige/café
- Tipografía Playfair Display + DM Sans
- Colores: #FAFAF9 (fondo), #D4A574 (primario), #1A1A1A (secundario), #C9A96E (acento)
- Logo oficial de Esencia integrado

## Endpoints API
- POST /api/auth/register, /api/auth/login, GET /api/auth/me
- GET /api/promotions, POST /api/redeem/{id}
- GET /api/my-redemptions, /api/history
- GET /api/admin/customers, /api/admin/customer/{id}, /api/admin/stats
- POST /api/admin/points, /api/admin/promotions
- PUT/DELETE /api/admin/promotions/{id}
- GET /api/admin/pending-redemptions, POST /api/admin/validate/{id}
