# Main_app

Aplicacion de fidelizacion con:

- `backend/`: API FastAPI + MongoDB
- `frontend/`: app Expo Router / React Native

## Variables de entorno

Backend:

- `MONGO_URL`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRE_MINUTES` opcional, por defecto `60`
- `APP_ENV` opcional, por defecto `development`
- `SEED_DEFAULT_DATA` opcional, por defecto `true` fuera de produccion
- `ALLOWED_ORIGINS` opcional, lista separada por comas
- `DEMO_ADMIN_EMAIL` y `DEMO_ADMIN_PASSWORD` opcionales
- `DEMO_CUSTOMER_EMAIL` y `DEMO_CUSTOMER_PASSWORD` opcionales

Frontend:

- `EXPO_PUBLIC_BACKEND_URL`
- Si no la defines y abres la app en web local, el frontend intentara usar `http://<host>:8000` automaticamente
- En produccion web, si no la defines, el frontend asumira que el backend vive en el mismo dominio bajo `/api`
- Para tu despliegue actual en Expo Hosting, el valor esperado es `https://esencia-rewards.onrender.com`

## Arranque local

Backend:

```bash
cd backend
uvicorn server:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run start
```

## Produccion actual

- Frontend web: `https://esenciacafe-esencia-cafe.expo.app`
- Backend API: `https://esencia-rewards.onrender.com`
- Configuracion recomendada:
  - `frontend/.env.example` muestra el valor esperado de `EXPO_PUBLIC_BACKEND_URL`
  - `backend/.env.example` muestra la base minima para Render
- Si la build web se publica sin variable de entorno, el frontend intentara usar automaticamente el backend de Render cuando se cargue desde los dominios de produccion conocidos de Expo para este proyecto.

## Notas

- El backend ahora crea indices para usuarios, promociones, canjes y transacciones al iniciar.
- Los datos demo se pueden desactivar con `SEED_DEFAULT_DATA=false`.
- Los tokens JWT expiran segun `JWT_EXPIRE_MINUTES`.
- Si frontend y backend estan en dominios distintos, define `EXPO_PUBLIC_BACKEND_URL` en el hosting del frontend y `ALLOWED_ORIGINS` en el backend con la URL publica del frontend.
