// backend/server.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import usuarioRoutes from "./Routers/usuario.routes.js";

import { sequelize } from "./config/db.js"; // default export
import authRoutes from "./Routers/auth.routes.js";
import beneficiarioRoutes from "./Routers/beneficiarioRoutes.js";
import inventarioRoutes from "./Routers/inventarioRoutes.js"; // si lo creaste así




// 1) Crear la app ANTES de usarla
const app = express();

// 2) Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));


// 3) Rutas (ya puedes usar app.use)
app.use("/api/auth", authRoutes);
app.use("/api/beneficiarios", beneficiarioRoutes);
app.use("/api/inventario", inventarioRoutes); // si existe
//Usuarios 
app.use("/api/usuarios", usuario.routes);

// 4) Probar/conectar BD (opcional pero útil)
try {
  await sequelize.authenticate();
  console.log("✅ Conexión a BD OK");
  // opcional: await sequelize.sync(); // cuidado en prod
} catch (err) {
  console.error("❌ Error al conectar BD:", err.message);
}

// 5) Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});

export default app; // opcional si lo usas en tests
