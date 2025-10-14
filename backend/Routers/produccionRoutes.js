// backend/Routers/produccionRoutes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { listar, obtener, crear, eliminar } from "../controllers/produccion.controller.js";

const router = Router();

// Ver listados/detalle: autenticado
router.get("/", requireAuth, listar);
router.get("/:id", requireAuth, obtener);

// Crear/eliminar: ADMIN o STAFF (ajusta si quieres)
router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), crear);
router.delete("/:id", requireAuth, requireRole("ADMIN"), eliminar);

export default router;
