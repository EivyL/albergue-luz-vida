import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { crearUsuario, listarUsuarios, actualizarUsuario, cambiarPassword } from "../controllers/usuarioController.js";

const router = Router();

// Todas protegidas
router.use(requireAuth);

// Solo ADMIN crea
router.post("/", requireRole("ADMIN"), crearUsuario);

// ADMIN y COORD pueden listar
router.get("/", requireRole("ADMIN","COORD"), listarUsuarios);

// ADMIN actualiza
router.put("/:id", requireRole("ADMIN"), actualizarUsuario);

// ADMIN o el propio usuario puede cambiar su password
router.patch("/:id/password", requireRole("ADMIN","COORD","TSOCIAL","INV","COMPRAS","PROD","LECTOR"), cambiarPassword);

export default router;
