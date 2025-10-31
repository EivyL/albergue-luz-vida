// backend/server.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import sequelize from "./config/db.js";

// Rutas
import authRoutes from "./Routers/auth.routes.js";
import usuarioRoutes from "./Routers/usuario.routes.js";
import beneficiarioRoutes from "./Routers/beneficiarioRoutes.js";
import produccionRoutes from "./Routers/produccionRoutes.js";
import statsRoutes from "./Routers/statsRoutes.js";
import habitacionesRouter from "./Routers/habitaciones.js";
import inventarioCocinaRoutes from "./Routers/inventarioCocina.js";
import bodegaRouter from "./Routers/bodega.js";


const app = express();

// ====== CORS ======
// Permite definir 1 o más orígenes separados por coma en CORS_ORIGIN.
// Ej: "https://albergue-luz-vida.onrender.com,https://midominio.com"
const ALLOWED = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// Si usas cookies entre dominios, pon CORS_CREDENTIALS=true en Render.
// O déjalo en false si solo usas Authorization: Bearer (lo que ya haces).
const USE_CREDENTIALS = String(process.env.CORS_CREDENTIALS || "false") === "true";

const corsOpts = {
  origin(origin, cb) {
    // permitir health checks/curl (sin Origin)
    if (!origin) return cb(null, true);
    if (ALLOWED.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origen no permitido -> ${origin}`));
  },
  credentials: USE_CREDENTIALS,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
};

app.use(cors(corsOpts));
app.options("*", cors(corsOpts)); // preflight

// ====== Middlewares comunes ======
app.use(express.json());
app.use(morgan("dev"));

// ====== Rutas ======
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/beneficiarios", beneficiarioRoutes);
app.use("/api/produccion", produccionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/habitaciones", habitacionesRouter);
app.use("/api/inventario", inventarioCocinaRoutes);
app.use("/api/bodega", bodegaRouter);

// Healthcheck
app.get("/health", (_req, res) => res.status(200).json({ ok: true, ts: Date.now() }));

// ====== DB ======
try {
  await sequelize.authenticate();
  console.log("✅ Conexión a BD OK");
} catch (err) {
  console.error("❌ Error al conectar BD:", err.message);
}

// ====== Arranque ======
const PORT = process.env.PORT || 3000;
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => console.log(`🚀 Servidor en ${PORT}`));
}
export default app;
