// backend/Routers/beneficiarioRoutes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { listarBeneficiarios, crearBeneficiario, actualizarBeneficiario, eliminar } from "../controllers/beneficiario.controller.js";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN","COORD",), listarBeneficiarios);
router.post("/", requireAuth, requireRole("ADMIN","COORD",), crearBeneficiario);
router.put("/:id", requireAuth, requireRole("ADMIN","COORD",), actualizarBeneficiario);
router.delete("/:id", requireAuth, requireRole("ADMIN"), eliminar);

export default router;
