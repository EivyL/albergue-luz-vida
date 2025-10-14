// backend/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../Models/Usuario.js";

const JWT_SECRET  = process.env.JWT_SECRET || "2003";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "12h";

const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

/**
 * POST /api/auth/login
 * Body: { correo: string | nombre_usuario, contrasena: string }
 * Res:  { token, usuario: { id, nombre, correo, rol } }
 */
export const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ message: "Correo/usuario y contraseña son requeridos" });
    }

    // Buscar primero por correo; si no, por nombre_usuario
    const byCorreo = await Usuario.findOne({ where: { correo, estado: true } });
    const byUser   = !byCorreo
      ? await Usuario.findOne({ where: { nombre_usuario: correo, estado: true } })
      : null;

    const user = byCorreo || byUser;
    if (!user) return res.status(401).json({ message: "Usuario o contraseña incorrectos" });

    const ok = await bcrypt.compare(contrasena, user.contrasena);
    if (!ok) return res.status(401).json({ message: "Usuario o contraseña incorrectos" });

    // Actualiza último login si la columna existe
    try {
      user.ultimo_login = new Date();
      await user.save();
    } catch (e) {
      console.warn("No se pudo actualizar ultimo_login:", e?.message);
    }

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
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Error interno en login" });
  }
};

/**
 * GET /api/auth/perfil
 * Requiere middleware que coloque el payload del JWT en req.user
 * Res: { usuario: { id, nombre, correo, rol } }
 */
export const perfil = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ message: "No autenticado" });

    const user = await Usuario.findByPk(id);
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
