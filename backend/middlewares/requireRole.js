export const requireRole = (...allowed) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "No autenticado" });
    if (!allowed.includes(req.user.rol))
      return res.status(403).json({ message: "Auti" });
    next();
  };
  