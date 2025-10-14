// backend/Routers/compraRoutes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { listar, obtener, crear, eliminar } from "../controllers/compra.controller.js";

const router = Router();

// autenticado para ver
router.get("/", requireAuth, listar);
router.get("/:id", requireAuth, obtener);

// crear compras: STAFF o ADMIN (ajústalo si quieres)
router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), crear);

// eliminar: sólo ADMIN
router.delete("/:id", requireAuth, requireRole("ADMIN"), eliminar);

export default router;
