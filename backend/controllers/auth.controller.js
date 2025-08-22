import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../Models/Usuario.js";

const JWT_SECRET  = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "12h";

export const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ message: "Correo y contraseña son requeridos" });
    }

    const user = await Usuario.findOne({ where: { correo, estado: true } });
    if (!user) return res.status(401).json({ message: "Usuario o contraseña incorrectos" });

    const ok = await bcrypt.compare(contrasena, user.contrasena);
    if (!ok) return res.status(401).json({ message: "Usuario o contraseña incorrectos" });

    try {
      user.ultimo_login = new Date(); // comenta si tu tabla no tiene la columna
      await user.save();
    } catch (e) {
      console.warn("No se pudo actualizar ultimo_login:", e?.message);
    }

    const payload = { id: user.id_usuario, rol: user.rol, correo: user.correo };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

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
