import bcrypt from "bcryptjs";
import db from "../config/db.js";
import UsuarioFactory from "../Models/Usuario.js";
import { isValidRole } from "../constants/roles.js";

//const Usuario = UsuarioFactory(db, db.Sequelize?.DataTypes || (await import("sequelize")).DataTypes);

// Crear usuario (solo ADMIN)
export const crearUsuario = async (req, res) => {
  try {
    const { nombreUsuario, correo, contrasena, rol, estado = true } = req.body;
    if (!isValidRole(rol)) return res.status(400).json({ message: "Rol inválido" });

    const exists = await Usuario.findOne({ where: { correo } });
    if (exists) return res.status(409).json({ message: "Correo ya usado" });

    const hash = await bcrypt.hash(contrasena, 10);
    const nuevo = await Usuario.create({ nombreUsuario, correo, contrasena: hash, rol, estado });
    res.status(201).json({ id: nuevo.idUsuario });
  } catch (e) {
    res.status(500).json({ message: "Error al crear usuario", detail: e.message });
  }
};

// Listar usuarios (ADMIN y COORD)
export const listarUsuarios = async (req, res) => {
  try {
    const { rol, estado } = req.query;
    const where = {};
    if (rol) where.rol = rol;
    if (estado !== undefined) where.estado = estado === "true";
    const lista = await Usuario.findAll({
      where, order: [['id_usuario','DESC']],
      attributes: ['idUsuario','nombreUsuario','correo','rol','estado','ultimoLogin','created_at','updated_at']
    });
    res.json(lista);
  } catch (e) {
    res.status(500).json({ message: "Error al listar usuarios" });
  }
};

// Actualizar usuario (ADMIN)
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreUsuario, rol, estado } = req.body;
    const data = {};
    if (nombreUsuario) data.nombreUsuario = nombreUsuario;
    if (rol) {
      if (!isValidRole(rol)) return res.status(400).json({ message: "Rol inválido" });
      data.rol = rol;
    }
    if (estado !== undefined) data.estado = !!estado;
    const [n] = await Usuario.update(data, { where: { idUsuario: id } });
    if (!n) return res.status(404).json({ message: "No encontrado" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

// Cambiar contraseña (ADMIN o el propio usuario)
export const cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { contrasena } = req.body;
    if (!contrasena) return res.status(400).json({ message: "Contraseña requerida" });

    // Si no es ADMIN, solo puede cambiar la suya
    if (req.user.rol !== "ADMIN" && Number(id) !== Number(req.user.idUsuario)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const [n] = await Usuario.update({ contrasena: hash }, { where: { idUsuario: id } });
    if (!n) return res.status(404).json({ message: "No encontrado" });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al cambiar contraseña" });
  }
};
