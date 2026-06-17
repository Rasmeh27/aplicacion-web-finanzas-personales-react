# MONI Frontend MVP

Frontend oficial de MONI construido con Next.js 16, React, TypeScript y Tailwind CSS.

## Requisitos

- Node.js 20.9 o superior.
- Backend corriendo en `http://localhost:3001`.
- API base: `http://localhost:3001/api/v1`.

## Configuracion

Crear `.env.local` a partir del ejemplo:

```bash
cp .env.local.example .env.local
```

Contenido esperado:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Ejecutar

```bash
npm install
npm run dev
```

Abrir:

```txt
http://localhost:3000
```

## Pantallas MVP

- `/login`: inicia sesion contra `POST /auth/login`.
- `/register`: crea cuenta contra `POST /auth/register`.
- `/dashboard`: requiere Bearer token y consume metricas reales del backend.

## Flujo manual de prueba

1. Iniciar el backend.
2. Iniciar este frontend con `npm run dev`.
3. Abrir `http://localhost:3000/register`.
4. Crear un usuario con nombre, correo, contrasena, moneda, ingreso estimado y porcentaje de ahorro.
5. Si Supabase exige confirmacion de correo, confirmar el usuario y luego usar `/login`.
6. Iniciar sesion en `http://localhost:3000/login`.
7. Entrar al dashboard y confirmar que carga perfil, metricas del mes y ultimos movimientos.

## Cuerpos esperados

Registro:

```json
{
  "fullName": "Usuario Prueba",
  "email": "usuario@example.com",
  "password": "Password123!",
  "primaryCurrency": "DOP",
  "monthlyIncomeEstimate": 45000,
  "monthlySavingTargetPct": 20
}
```

Login:

```json
{
  "email": "usuario@example.com",
  "password": "Password123!"
}
```

El frontend guarda `accessToken`, `refreshToken` y `user` en `localStorage` bajo la clave `moni-session`.

## Comportamiento esperado

- Si `/auth/register` devuelve tokens, el usuario pasa directo al dashboard.
- Si el registro queda pendiente de confirmacion, se muestra un mensaje para confirmar el correo.
- Si `/auth/login` es correcto, el usuario entra a `/dashboard`.
- Si una llamada protegida devuelve `401`, el cliente intenta `POST /auth/refresh`.
- Si el refresh falla, se limpia la sesion local y se vuelve a `/login`.

## Datos que consume el dashboard

- `GET /user/me`
- `GET /dashboard-reports/monthly-income-total`
- `GET /dashboard-reports/monthly-expense-total`
- `GET /dashboard-reports/monthly-balance`
- `GET /dashboard-reports/savings-percentage`
- `GET /dashboard-reports/financial-health`
- `GET /transactions?limit=5&offset=0`

## Validacion

```bash
npm run lint
npm run build
```
