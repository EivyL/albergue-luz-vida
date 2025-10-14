// backend/Models/CompraItem.js
import { DataTypes } from "sequelize";
import db from "../config/db.js";
import Compra from "./Compra.js";

const CompraItem = db.define("CompraItem", {
  id_compra_item: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id_item" },
  id_compra: { type: DataTypes.INTEGER, allowNull: false, references: { model: "compras", key: "id_compra" } },
  producto_id: { type: DataTypes.STRING(150), allowNull: false, field: "producto_id" },
  producto:       { type: DataTypes.STRING(150), allowNull: true,  field: "producto" },
  cantidad: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  precio: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  subtotal: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
}, {
  tableName: "compra_items",
  timestamps: false,
  underscored: true,
});

// relaciones
Compra.hasMany(CompraItem, { foreignKey: "id_compra", as: "items", sourceKey: "id_compra" });
CompraItem.belongsTo(Compra, { foreignKey: "id_compra", as: "compra", targetKey: "id_compra" });

export default CompraItem;
