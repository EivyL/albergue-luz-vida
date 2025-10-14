// backend/Models/Usuario.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Usuario = sequelize.define("Usuario", {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
  correo: { type: DataTypes.STRING, allowNull: false, unique: true },
  contrasena: { type: DataTypes.STRING, allowNull: false },
  rol: {
    type: DataTypes.ENUM(
      "ADMIN", "STAFF", "COORD", "TSOCIAL", "INV", "COMPRAS", "PROD", "LECTOR"
    ),
    defaultValue: "STAFF",
    allowNull: false
  },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true },
  ultimo_login: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: "usuarios",
  underscored: true,
  timestamps: true, // created_at / updated_at
});

export default Usuario;
