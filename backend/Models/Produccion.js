// backend/Models/Produccion.js
import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Produccion = db.define("Produccion", {
  id_produccion: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  responsable: { type: DataTypes.STRING(120), allowNull: true },
  observaciones: { type: DataTypes.TEXT, allowNull: true },
  estado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, // soft delete
}, {
  tableName: "produccion",
  timestamps: true,
  underscored: true,
});

export default Produccion;
