// backend/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";
import Usuario from "../Models/Usuario.js";

const JWT_SECRET  = process.env.JWT_SECRET  || "2003";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "12h";

const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

// ---------- SQL de permisos (definida en el mismo archivo) ----------
const SQL_PERMISOS = `
  SELECT
    m.clave,
    rm.can_create,
    rm.can_read,
    rm.can_update,
    rm.can_delete
  FROM role_modulos rm
  JOIN modulos m ON m.id = rm.modulo_id
  WHERE rm.role_id = :roleId
  ORDER BY m.clave;
`;

// helper para traer permisos por rol_id (1=ADMIN, etc.)
async function getPermisosPorRol(roleId) {
  const rows = await sequelize.query(SQL_PERMISOS, {
    replacements: { roleId },
    type: QueryTypes.SELECT,
  });
  return rows ?? [];
}

/**
 * POST /api/auth/login
 * Body: { correo: string | nombre_usuario, contrasena: string }
 * Res:  { token, usuario: { id, nombre, correo, rol }, menus }
 */
export const login = async (req, res) => {
  try {
    let { correo, contrasena } = req.body || {};
    correo = (correo || "").trim();

    if (!correo || !contrasena) {
      return res
        .status(400)
        .json({ message: "Correo/usuario y contraseña son requeridos" });
    }

    const attrs = [
      "id_usuario",
      "nombre_usuario",
      "correo",
      "contrasena",
      "rol",           // mapeado a rol_id en DB
      "estado",
      "ultimo_login",
    ];

    // buscar por correo; si no hay, por username
    const byCorreo = await Usuario.findOne({
      where: { correo, estado: true },
      attributes: attrs,
    });

    const byUser = !byCorreo
      ? await Usuario.findOne({
          where: { nombre_usuario: correo, estado: true },
          attributes: attrs,
        })
      : null;

    const user = byCorreo || byUser;
    if (!user) {
      return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    }

    const ok = await bcrypt.compare(contrasena, user.contrasena);
    if (!ok) {
      return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    }

    // actualizar último login usando la PK correcta
    try {
      await Usuario.update(
        { ultimo_login: new Date() },
        { where: { id_usuario: user.id_usuario } }
      );
    } catch (e) {
      console.warn("No se pudo actualizar ultimo_login:", e?.message);
    }

    // permisos por rol (user.rol es el rol_id entero)
    const menus = await getPermisosPorRol(user.rol);

    const payload = { id: user.id_usuario, rol: user.rol, correo: user.correo };
    const token = signToken(payload);

    return res.json({
      token,
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre_usuario,
        correo: user.correo,
        rol: user.rol,
      },
      menus, // <<--- aquí vienen los módulos/permisos
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Error interno en login" });
  }
};

export const perfil = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ message: "No autenticado" });

    const user = await Usuario.findByPk(id, {
      attributes: ["id_usuario", "nombre_usuario", "correo", "rol", "estado", "ultimo_login"],
    });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.json({
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre_usuario,
        correo: user.correo,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("Perfil error:", err);
    return res.status(500).json({ message: "Error interno" });
  }
};
