// backend/controllers/usuarioController.js
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import Usuario from "../Models/Usuario.js";

const toSafe = (u) => ({
  id_usuario: u.id_usuario,
  nombre_usuario: u.nombre_usuario,
  correo: u.correo,
  rol: u.rol,
  estado: u.estado,
  ultimo_login: u.ultimo_login,
  created_at: u.createdAt,
  updated_at: u.updatedAt,
});

// LISTAR
export const listarUsuarios = async (req, res) => {
  try {
    const { q = "", page = 1, limit = 20, soloActivos } = req.query;
    const where = {};
    if (q) {
      where[Op.or] = [
        { nombre_usuario: { [Op.iLike]: `%${q}%` } },
        { correo: { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (soloActivos === "true") where.estado = true;

    const result = await Usuario.findAndCountAll({
      where,
      order: [["id_usuario", "DESC"]],
      offset: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    });

    res.json({
      total: result.count,
      items: result.rows.map(toSafe),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listando usuarios" });
  }
};

// OBTENER
export const obtener = async (req, res) => {
  try {
    const u = await Usuario.findByPk(req.params.id);
    if (!u) return res.status(404).json({ message: "No encontrado" });
    res.json(toSafe(u));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error obteniendo usuario" });
  }
};

// CREAR
export const crearUsuario = async (req, res) => {
  try {
    const { nombre_usuario, correo, contrasena, rol = "STAFF" } = req.body;
    if (!nombre_usuario || !correo || !contrasena) {
      return res.status(400).json({ message: "nombre_usuario, correo y contrasena son requeridos" });
    }

    const existe = await Usuario.findOne({ where: { [Op.or]: [{ correo }, { nombre_usuario }] } });
    if (existe) {
      return res.status(409).json({ message: "Correo o nombre de usuario ya están registrados" });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const rolFinal = [
      "ADMIN","STAFF","COORD","TSOCIAL","INV","COMPRAS","PROD","LECTOR"
    ].includes(rol) ? rol : "STAFF";

    const u = await Usuario.create({
      nombre_usuario,
      correo,
      contrasena: hash,
      rol: rolFinal,
      estado: true,
    });

    res.status(201).json(toSafe(u));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error creando usuario" });
  }
};

// ACTUALIZAR
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ message: "No encontrado" });

    const { nombre_usuario, correo, rol, estado } = req.body;

    if (correo && correo !== u.correo) {
      const clash = await Usuario.findOne({ where: { correo } });
      if (clash) return res.status(409).json({ message: "Correo ya registrado" });
    }
    if (nombre_usuario && nombre_usuario !== u.nombre_usuario) {
      const clash = await Usuario.findOne({ where: { nombre_usuario } });
      if (clash) return res.status(409).json({ message: "Nombre de usuario ya registrado" });
    }

    let rolFinal = u.rol;
    if (rol) {
      rolFinal = [
        "ADMIN","STAFF","COORD","TSOCIAL","INV","COMPRAS","PROD","LECTOR"
      ].includes(rol) ? rol : u.rol;
    }

    await u.update({
      nombre_usuario: nombre_usuario ?? u.nombre_usuario,
      correo: correo ?? u.correo,
      rol: rolFinal,
      estado: typeof estado === "boolean" ? estado : u.estado,
    });

    res.json(toSafe(u));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error actualizando usuario" });
  }
};

// CAMBIAR PASSWORD
export const cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { nueva, password } = req.body;
    const plain = nueva ?? password;
    if (!plain) return res.status(400).json({ message: "Nueva contraseña requerida" });

    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ message: "No encontrado" });

    const hash = await bcrypt.hash(plain, 10);
    await u.update({ contrasena: hash });

    res.json({ message: "Contraseña actualizada" });
  } catch (err) {
    res.status(500).json({ message: "Error al cambiar contraseña", error: err.message });
  }
};

// CAMBIAR ESTADO (toggle)
export const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;

    // Evitar desactivarse a sí mismo
    if (Number(id) === Number(req.user?.id_usuario)) {
      return res.status(400).json({ message: "No puedes desactivar tu propio usuario" });
    }

    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ message: "No encontrado" });

    await u.update({ estado: !u.estado });
    res.json(toSafe(u));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error cambiando estado" });
  }
};

// RESET PASSWORD directo (admin)
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { nueva } = req.body;
    if (!nueva) return res.status(400).json({ message: "La nueva contraseña es requerida" });

    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ message: "No encontrado" });

    const hash = await bcrypt.hash(nueva, 10);
    await u.update({ contrasena: hash });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error reseteando contraseña" });
  }
};

// ELIMINAR (soft delete)
export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    // Evitar auto-eliminarse
    if (Number(id) === Number(req.user?.id_usuario)) {
      return res.status(400).json({ message: "No puedes eliminar tu propio usuario" });
    }

    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ message: "No encontrado" });

    await u.update({ estado: false });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error eliminando usuario" });
  }
};
