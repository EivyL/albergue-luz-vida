import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  listarInventario,
  crearItem,
  borrarItem,
  ajustarCantidad,
} from "../controllers/inventario.controller.js";

const router = Router();

router.get("/", requireAuth, listarInventario);
router.post("/", requireAuth, crearItem);
router.delete("/:id", requireAuth, borrarItem);
router.patch("/:id/ajustar", requireAuth, ajustarCantidad);

export default router;
