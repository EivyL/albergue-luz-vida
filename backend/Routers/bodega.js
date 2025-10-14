import express from "express";
import * as c from "../controllers/bodegaController.js";

const router = express.Router();

router.get("/items", c.listItems);
router.post("/items", c.createItem);
router.patch("/items/:id", c.updateItem);
router.post("/items/:id/movimientos", c.aplicarMovimiento);
router.get("/movimientos", c.listMovimientos);
router.get("/export.csv", c.exportCSV);
router.get("/export.html", c.exportHTML);

export default router; // <-- IMPORTANTE
