// backend/Models/ProduccionDetalle.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // ⬅️ AJUSTA esta ruta igual que en tu Usuario.js

const ProduccionDetalle = sequelize.define(
  "ProduccionDetalle",
  {
    id_detalle: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_produccion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Si en tu inventario usas "insumos", cambia a id_insumo
    id_producto: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    costo_unitario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "produccion_detalle",
    timestamps: true,
    hooks: {
      beforeValidate: (det) => {
        const cant = Number(det.cantidad ?? 0);
        const costo = Number(det.costo_unitario ?? 0);
        det.subtotal = cant * costo;
      },
    },
  }
);

export default ProduccionDetalle;
