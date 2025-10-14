// backend/Routers/usuario.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import {
  crearUsuario,
  listarUsuarios,
  obtener,
  actualizarUsuario,
  cambiarEstado,
  cambiarPassword,
  resetPassword,
  eliminar
} from "../controllers/usuarioController.js";

const router = Router();

// Todas protegidas
router.use(requireAuth);

// Crear (solo ADMIN)
router.post("/", requireRole("ADMIN"), crearUsuario);

// Listar (ADMIN y COORD)
router.get("/", requireRole("ADMIN","COORD"), listarUsuarios);

// Obtener uno (ADMIN y COORD)
router.get("/:id", requireRole("ADMIN","COORD"), obtener);

// Actualizar (solo ADMIN)
router.put("/:id", requireRole("ADMIN"), actualizarUsuario);

// Cambiar password (ADMIN o el propio usuario; tu middleware quizás solo valida rol,
// si quieres permitir "propietario", añade lógica en el controlador/middleware)
router.patch("/:id/password", requireRole("ADMIN","COORD","TSOCIAL","INV","COMPRAS","PROD","LECTOR"), cambiarPassword);

// Toggle estado (solo ADMIN)
router.patch("/:id/estado", requireRole("ADMIN"), cambiarEstado);

// Reset password directo (solo ADMIN)
router.patch("/:id/reset-password", requireRole("ADMIN"), resetPassword);

// Eliminar (solo ADMIN) — OJO: sin array
router.delete("/:id", requireRole("ADMIN"), eliminar);

export default router;
