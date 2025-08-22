# Backend (Express + Sequelize + Postgres)

## Pasos
1. Copia `.env.example` a `.env` y ajusta credenciales.
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Crea el admin:
   ```bash
   npm run seed:admin
   ```
4. Levanta el servidor:
   ```bash
   npm run dev
   ```
   Escucha en `http://localhost:4000`.

## Rutas
- `POST /api/auth/login`  { correo, contrasena }
- `GET  /api/auth/perfil`  (Bearer token)
