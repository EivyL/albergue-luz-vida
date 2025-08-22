import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No autenticado" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { idUsuario, rol, correo }
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
};
