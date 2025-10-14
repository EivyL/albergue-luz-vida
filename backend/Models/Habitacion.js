// Models/Habitacion.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Habitacion = sequelize.define("Habitacion", {
  id_habitacion: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },     // p.ej. "H-101"
  sexo: { type: DataTypes.ENUM("H","M"), allowNull: false }, // H: hombres, M: mujeres
  piso: { type: DataTypes.INTEGER, allowNull: true },
  capacidad_literas: { type: DataTypes.INTEGER, defaultValue: 0 },
  activa: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: "habitaciones",
  timestamps: true,
  underscored: true,
});

export default Habitacion;
