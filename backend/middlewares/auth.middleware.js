import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.substring(7) : null;
  if (!token) return res.status(401).json({ message: "Token requerido" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, rol: payload.rol };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token inválido" });
  }
};
