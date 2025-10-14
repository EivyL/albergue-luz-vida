// backend/Routers/statsRoutes.js
import { Router } from "express";
import { overview } from "../controllers/stats.controller.js";

const router = Router();
router.get("/overview", overview);
export default router;
