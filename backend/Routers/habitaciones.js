import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import {
  listarHabitaciones,
  listarCamasDeHabitacion,
  generarCamas,
  asignarCama,
  liberarCama,
  beneficiariosDisponibles,
} from "../controllers/habitacionController.js";

const r = Router();


r.get("/", requireAuth, requireRole("ADMIN","STAFF","MANAGER"), listarHabitaciones);
r.get("/_aux/beneficiarios/disponibles", requireAuth, requireRole("ADMIN","STAFF","MANAGER"), beneficiariosDisponibles);
r.get("/:id/camas", requireAuth, requireRole("ADMIN","STAFF","MANAGER"), listarCamasDeHabitacion);
r.post("/:id/generar-camas", requireAuth, requireRole("ADMIN","MANAGER"), generarCamas);
r.patch("/camas/:id/asignar", requireAuth, requireRole("ADMIN","STAFF","MANAGER"), asignarCama);
r.patch("/camas/:id/liberar", requireAuth, requireRole("ADMIN","STAFF","MANAGER"), liberarCama);


export default r;
