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

## Notas

- El backend ahora crea indices para usuarios, promociones, canjes y transacciones al iniciar.
- Los datos demo se pueden desactivar con `SEED_DEFAULT_DATA=false`.
- Los tokens JWT expiran segun `JWT_EXPIRE_MINUTES`.
