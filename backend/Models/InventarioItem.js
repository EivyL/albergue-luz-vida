// ESM
import { DataTypes } from "sequelize";
import db from "../config/db.js";

const InventarioItem = db.define(
  "InventarioItem",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(120), allowNull: false },
    area: { type: DataTypes.ENUM("COCINA", "BODEGA"), allowNull: false },
    categoria: { type: DataTypes.STRING(80) },
    unidad: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "unidad" },
    perishable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    fecha_caducidad: { type: DataTypes.DATEONLY },
    ubicacion: { type: DataTypes.STRING(120) },

    // Bodega
    talla: { type: DataTypes.STRING(20) },
    color: { type: DataTypes.STRING(30) },
    estado: { type: DataTypes.STRING(20) },

    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    min_stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "inventario_items",
    underscored: true,
    timestamps: true, // created_at y updated_at
  }
);

export default InventarioItem;
