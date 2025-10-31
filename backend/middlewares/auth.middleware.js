// backend/middleware/requireAuth.js
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "2003";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.substring(7) : null;
  if (!token) return res.status(401).json({ message: "Token requerido" });

  try {
    const p = jwt.verify(token, JWT_SECRET);

    req.user = {
      // id <- acepta 'id' o 'sub'
      id: p.id ?? p.sub ?? null,
      // rol (numérico) <- acepta 'rol' o (si role es numérico) 'role'
      rol: p.rol ?? (typeof p.role === "number" ? p.role : null),
      // role (string) <- acepta 'role' si es string
      role: typeof p.role === "string" ? p.role : null,
      // permisos
      perms: Array.isArray(p.perms) ? p.perms : [],
      // email opcional
      email: p.email ?? p.correo ?? null,
      // mantén el payload raw por si quieres inspeccionar
      raw: p,
    };

    // log temporal para debug — quítalo en producción
    console.log("requireAuth -> req.user:", req.user);

    next();
  } catch (e) {
    console.error("requireAuth verify error:", e.message);
    return res.status(401).json({ message: "Token inválido" });
  }
};
