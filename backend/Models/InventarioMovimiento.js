import { DataTypes } from "sequelize";
import db from "../config/db.js";

const InventarioMovimiento = db.define(
  "InventarioMovimiento",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    item_id: { type: DataTypes.BIGINT, allowNull: false },
    area: { type: DataTypes.ENUM("COCINA", "BODEGA"), allowNull: false },
    tipo: { type: DataTypes.ENUM("INGRESO", "EGRESO", "AJUSTE"), allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    motivo: { type: DataTypes.TEXT },
    referencia: { type: DataTypes.STRING(80) },
    fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    usuario_id: { type: DataTypes.BIGINT },
  },
  {
    tableName: "inventario_movimientos",
    underscored: true,
    timestamps: true, // created_at
    updatedAt: false, // no necesitamos updated_at aquí
  }
);

export default InventarioMovimiento;
