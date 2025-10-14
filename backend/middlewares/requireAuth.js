// backend/middlewares/requireAuth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "2003";

export function requireAuth(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ message: "Token requerido" });

  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Formato de token inválido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, rol, correo, ... }
    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
}
