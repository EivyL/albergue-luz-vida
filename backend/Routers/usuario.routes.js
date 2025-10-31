// backend/Routers/usuario.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import Usuario from "../Models/Usuario.js";
import bcrypt from "bcryptjs";

const router = Router();

/** Permite solo ADMIN.
 *  - Si tu token trae `rol` como número (rol_id), cambia `user.rol === 1`.
 *  - Si trae string 'ADMIN', deja `user.rol === 'ADMIN'`.
 */
function isAdmin(req, res, next) {
  const r = req.user?.rol;
  if (r === 1 || r === "ADMIN") return next();
  return res.status(403).json({ message: "No autorizado" });
}

/** GET /api/usuarios?q=texto */
router.get("/", requireAuth, isAdmin, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const where = q
      ? {
          // básico: filtra por nombre o correo (case-insensitive)
          [Usuario.sequelize.Op.or]: [
            Usuario.sequelize.where(
              Usuario.sequelize.fn("LOWER", Usuario.sequelize.col("nombre")),
              "LIKE",
              `%${q.toLowerCase()}%`
            ),
            Usuario.sequelize.where(
              Usuario.sequelize.fn("LOWER", Usuario.sequelize.col("correo")),
              "LIKE",
              `%${q.toLowerCase()}%`
            ),
          ],
        }
      : undefined;

    const list = await Usuario.findAll({
      where,
      attributes: [
        ["id", "id"], // mapea si tu modelo usa 'id' o 'id_usuario'
        ["nombre", "nombre"],
        "correo",
        "rol",         // si tu columna es rol_id, asegúrate que el Modelo lo mapea como 'rol'
        "activo",
        "ultimo_login",
        "created_at",
        "updated_at",
      ],
      order: [["id", "ASC"]],
      limit: 100,
    });

    res.json({ data: list });
  } catch (err) {
    console.error("GET /usuarios error:", err);
    res.status(500).json({ message: "Error interno" });
  }
});

/** POST /api/usuarios  { nombre, correo, contrasena, rol } */
router.post("/", requireAuth, isAdmin, async (req, res) => {
  try {
    const { nombre, correo, contrasena, rol } = req.body || {};
    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    const exists = await Usuario.findOne({ where: { correo } });
    if (exists) return res.status(409).json({ message: "Correo ya registrado" });

    const hash = await bcrypt.hash(contrasena, 10);
    const nuevo = await Usuario.create({
      nombre,
      correo,
      contrasena: hash,
      rol,          // si tu columna real es rol_id, envía rol_id aquí
      activo: true,
    });

    res.status(201).json({
      id: nuevo.id ?? nuevo.id_usuario,
      nombre: nuevo.nombre ?? nuevo.nombre_usuario,
      correo: nuevo.correo,
      rol: nuevo.rol,
      activo: nuevo.activo,
    });
  } catch (err) {
    console.error("POST /usuarios error:", err);
    res.status(500).json({ message: "Error interno" });
  }
});

/** PUT /api/usuarios/:id  { nombre?, correo?, contrasena?, rol?, activo? } */
router.put("/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const user = await Usuario.findByPk(id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const { nombre, correo, contrasena, rol, activo } = req.body || {};
    if (nombre !== undefined) user.nombre = nombre;
    if (correo !== undefined) user.correo = correo;
    if (rol !== undefined) user.rol = rol;
    if (activo !== undefined) user.activo = !!activo;
    if (contrasena) user.contrasena = await bcrypt.hash(contrasena, 10);

    await user.save();
    res.json({ message: "Actualizado" });
  } catch (err) {
    console.error("PUT /usuarios/:id error:", err);
    res.status(500).json({ message: "Error interno" });
  }
});

/** DELETE /api/usuarios/:id */
router.delete("/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const user = await Usuario.findByPk(id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    await user.destroy();
    res.json({ message: "Eliminado" });
  } catch (err) {
    console.error("DELETE /usuarios/:id error:", err);
    res.status(500).json({ message: "Error interno" });
  }
});

export default router;


