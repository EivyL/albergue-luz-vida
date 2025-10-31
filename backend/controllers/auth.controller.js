// backend/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sequelize from "../config/db.js";
import Usuario from "../Models/Usuario.js";

const JWT_SECRET  = process.env.JWT_SECRET  || "2003";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "12h";

/** Firma el JWT con id, rol y permisos (si hay) */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/** Lee permisos por rol desde role_modulos/modulos (si existen). Devuelve [] si no hay tablas o falla. */
async function getPermisosPorRol(roleId) {
  const sql = `
    SELECT m.clave AS clave,
           rm.can_create,
           rm.can_read,
           rm.can_update,
           rm.can_delete
    FROM role_modulos rm
    JOIN modulos m ON m.id = rm.modulo_id
    WHERE rm.role_id = :roleId
    ORDER BY m.clave;
  `;
  try {
    const [rows] = await sequelize.query(sql, { replacements: { roleId } });
    return rows || [];
  } catch {
    // Si la tabla aún no existe (ambiente local) no rompemos el login
    return [];
  }
}

/**
 * POST /api/auth/login
 * Body: { correo: string | nombre_usuario, contrasena: string }
 * Res:  { token, usuario: { id, nombre_usuario, correo, rol, perms } }
 */
export const login = async (req, res) => {
  try {
    let { correo, contrasena } = req.body || {};
    correo = (correo || "").trim();

    if (!correo || !contrasena) {
      return res.status(400).json({ message: "Correo/usuario y contraseña son requeridos" });
    }

    // Campos mapeados en tu modelo (id_usuario -> field 'id', nombre_usuario -> 'nombre', rol -> 'rol_id', etc.)
    const attrs = ["id_usuario", "nombre_usuario", "correo", "contrasena", "rol", "estado", "ultimo_login"];

    // Primero por correo; si no, por nombre de usuario
    const byCorreo = await Usuario.findOne({ where: { correo, estado: true }, attributes: attrs });
    const byUser   = !byCorreo
      ? await Usuario.findOne({ where: { nombre_usuario: correo, estado: true }, attributes: attrs })
      : null;

    const user = byCorreo || byUser;
    if (!user) return res.status(401).json({ message: "Usuario o contraseña incorrectos" });

    const ok = await bcrypt.compare(contrasena, user.contrasena);
    if (!ok) return res.status(401).json({ message: "Usuario o contraseña incorrectos" });

    // Permisos por rol (si existen tablas)
    const perms = await getPermisosPorRol(user.rol);

    // Actualiza último login (si el PK está bien mapeado no fallará)
    try {
      user.ultimo_login = new Date();
      await user.save(); // update by PK
    } catch (e) {
      console.warn("No se pudo actualizar ultimo_login:", e?.message);
    }

    const token = signToken({
      id: user.id_usuario,
      rol: user.rol,         // entero (rol_id)
      perms,                 // arreglo de permisos por módulo
      correo: user.correo,
    });

    return res.json({
      token,
      usuario: {
        id: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        correo: user.correo,
        rol: user.rol,
        perms,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Error interno en login" });
  }
};

/**
 * GET /api/auth/perfil
 * Requiere requireAuth. Devuelve datos del usuario y, si el token traía perms, los reenvía.
 */
export const perfil = async (req, res) => {
  try {
    const id = req.user?.id; // viene del token (id_usuario)
    if (!id) return res.status(401).json({ message: "No autenticado" });

    const user = await Usuario.findByPk(id, {
      attributes: ["id_usuario", "nombre_usuario", "correo", "rol", "estado", "ultimo_login"],
    });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // Reutilizamos permisos que ya venían en el token; si quieres, podrías recalcularlos con getPermisosPorRol(user.rol)
    const perms = Array.isArray(req.user?.perms) ? req.user.perms : [];

    return res.json({
      usuario: {
        id: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        correo: user.correo,
        rol: user.rol,
        estado: user.estado,
        ultimo_login: user.ultimo_login,
        perms,
      },
    });
  } catch (err) {
    console.error("Perfil error:", err);
    return res.status(500).json({ message: "Error interno" });
  }
};
