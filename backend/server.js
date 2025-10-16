// backend/server.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import sequelize from "./config/db.js";

// Rutas
import authRoutes from "./Routers/auth.routes.js";
import usuarioRoutes from "./Routers/usuario.routes.js";
import beneficiarioRoutes from "./Routers/beneficiarioRoutes.js";
//import inventarioRoutes from "./Routers/inventarioRoutes.js";
//import compraRoutes from "./Routers/compraRoutes.js";
import produccionRoutes from "./Routers/produccionRoutes.js";
import statsRoutes from "./Routers/statsRoutes.js";
import habitacionesRouter from "./Routers/habitaciones.js";
import "./Models/index.js";
import inventarioCocinaRoutes from "./Routers/inventarioCocina.js";
import bodegaRouter from "./Routers/bodega.js";


const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/beneficiarios", beneficiarioRoutes);
//app.use("/api/inventario", inventarioRoutes);
//app.use("/api/compras", compraRoutes);
app.use("/api/produccion", produccionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/habitaciones", habitacionesRouter);
app.use("/api/inventario", inventarioCocinaRoutes);
app.use("/api/bodega", bodegaRouter); 
app.get('/health', (_req, res) => res.status(200).json({ ok: true, ts: Date.now() }));


try {
  await sequelize.authenticate();
  console.log("✅ Conexión a BD OK");
} catch (err) {
  console.error("❌ Error al conectar BD:", err.message);
}

const PORT = process.env.PORT || 3000;
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => console.log(`🚀 Servidor en ${PORT}`));
}
export default app;
