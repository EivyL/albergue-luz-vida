import { Router } from 'express';
const router = Router();

// Rutas mínimas de prueba
router.get('/', (req, res) => {
  res.json({ ok: true, recurso: 'beneficiarios' });
});

export default router;
