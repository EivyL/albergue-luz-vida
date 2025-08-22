import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import { sequelize } from "../config/db.js";
import Usuario from "../Models/Usuario.js";

const run = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const correo = "admin@albergue.test";
    const nombre = "admin";
    const plain = "Admin123*";

    const exist = await Usuario.findOne({ where: { correo } });
    if (exist) {
      console.log("✅ Admin ya existe:", correo);
      process.exit(0);
    }

    const hash = await bcrypt.hash(plain, 10);
    const user = await Usuario.create({
      nombre_usuario: nombre,
      correo,
      contrasena: hash,
      rol: "ADMIN",
      estado: true
    });

    console.log("✅ Usuario admin creado:", { id: user.id_usuario, correo, pass: plain });
    process.exit(0);
  } catch (e) {
    console.error("❌ Error seed:", e);
    process.exit(1);
  }
};

run();
