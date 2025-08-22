// backend/Routers/inventarioRoutes.js
import { Router } from "express";

const router = Router();

// Ejemplo de endpoint: listar inventario
router.get("/", (req, res) => {
  res.json({ message: "Inventario funcionando ✅" });
});

// Aquí podrás agregar más endpoints CRUD después:
// router.post("/", (req, res) => {...});
// router.put("/:id", (req, res) => {...});
// router.delete("/:id", (req, res) => {...});

export default router;
