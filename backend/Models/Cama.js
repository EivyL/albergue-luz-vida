// Models/Cama.js
import { DataTypes, Op } from "sequelize";
import sequelize from "../config/db.js";
import Habitacion from "./Habitacion.js";

const Cama = sequelize.define("Cama", {
  id_cama: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  id_habitacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "habitaciones", key: "id_habitacion" },
  },

  litera: { type: DataTypes.INTEGER, allowNull: false },          // 1..N
  compartimiento: { type: DataTypes.INTEGER, allowNull: false },  // 1..3

  estado: {
    type: DataTypes.ENUM("LIBRE", "OCUPADA"),
    allowNull: false,
    defaultValue: "LIBRE",
  },

  codigo: { type: DataTypes.STRING, allowNull: false, unique: true }, // NOT NULL

  id_beneficiario: { type: DataTypes.INTEGER, allowNull: true },   // FK beneficiarios
  fecha_asignacion: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "camas",
  timestamps: true,
  underscored: true,

  // 🔒 Genera 'codigo' automáticamente si no viene
  hooks: {
    beforeValidate(cama) {
      if (!cama.codigo && cama.id_habitacion && cama.litera && cama.compartimiento) {
        // ejemplo legible: H{hab}-L{litera}-C{comp}
        cama.codigo = `H${cama.id_habitacion}-L${cama.litera}-C${cama.compartimiento}`;
      }
    },
  },

  indexes: [
    // Evita duplicar la misma posición física
    { unique: true, fields: ["id_habitacion", "litera", "compartimiento"] },

    // (Sólo Postgres) Un beneficiario activo en una sola cama
    // 👇 Corrige el uso de $not -> [Op.ne]
    { unique: true, fields: ["id_beneficiario"], where: { id_beneficiario: { [Op.ne]: null } } },
  ],
});

Habitacion.hasMany(Cama, { foreignKey: "id_habitacion" });
Cama.belongsTo(Habitacion, { foreignKey: "id_habitacion" });

export default Cama;
