import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Usuario = sequelize.define("Usuario", {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
  correo: { type: DataTypes.STRING, allowNull: false, unique: true },
  contrasena: { type: DataTypes.STRING, allowNull: false },
  rol: { type: DataTypes.ENUM("ADMIN", "COORDINADOR", "COLABORADOR"), defaultValue: "ADMIN" },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true },
  ultimo_login: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: "usuarios",
  underscored: true
});

export default Usuario;
