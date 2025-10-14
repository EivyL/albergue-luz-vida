// backend/Models/Inventario.js
import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Inventario = db.define(
  "Inventario",
  {
    id_inventario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_producto: { type: DataTypes.STRING(100), allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    unidad_medida: { type: DataTypes.STRING(20), allowNull: true },
    fecha_ingreso: { type: DataTypes.DATE, allowNull: true },
    fecha_salida: { type: DataTypes.DATE, allowNull: true },
    id_usuario: { type: DataTypes.INTEGER, allowNull: true }, // quién registró
  },
  {
    tableName: "inventario",
    timestamps: false, // dejamos tus columnas como están
  }
);

export default Inventario;
