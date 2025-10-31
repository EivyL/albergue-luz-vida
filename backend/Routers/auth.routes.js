import { Router } from "express";
import { login, perfil } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";


const router = Router();

router.post("/login", login);
router.get("/perfil", requireAuth, perfil);


export default router;
