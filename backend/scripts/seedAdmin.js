// backend/scripts/seedAdmin.js
import "dotenv/config";
import bcrypt from "bcryptjs";
import sequelize from "../config/db.js";   // 👈 import default (no llaves)
import Usuario from "../Models/Usuario.js";

(async () => {adm
  const correo = "in@albergue.test";
  const nombre = "admin";
  const plain  = "Admin123*";

  try {
    await sequelize.authenticate();

    // hash de la contraseña
    const hash = await bcrypt.hash(plain, 10);

    // busca por correo
    let user = await Usuario.findOne({ where: { correo } });

    if (!user) {
      // crea admin (ajusta rol/rol_id según tu modelo)
      user = await Usuario.create({
        nombre_usuario: nombre,
        correo,
        contrasena: hash,
        // Si tu modelo usa ENUM 'rol':
        rol: "ADMIN",
        // Si tu modelo usa FK 'rol_id', descomenta:
        // rol_id: 1,
        estado: true,
      });

      console.log("✅ Usuario admin creado:", {
        id: user.id_usuario ?? user.id,
        correo,
        pass: plain,
      });
    } else {
      // actualiza password/estado y asegura rol
      user.contrasena = hash;
      user.estado = true;

      if ("rol" in user && !user.rol) user.rol = "ADMIN";
      if ("rol_id" in user && !user.rol_id) user.rol_id = 1;

      await user.save();

      console.log("✅ Usuario admin actualizado:", {
        id: user.id_usuario ?? user.id,
        correo,
      });
    }
  } catch (e) {
    console.error("❌ Error seed:", e);
    process.exitCode = 1;
  } finally {
    // cierra la conexión antes de salir
    try { await sequelize.close(); } catch {}
  }
})();
