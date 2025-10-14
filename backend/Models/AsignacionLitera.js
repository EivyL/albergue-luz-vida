import { DataTypes } from "sequelize";
import db from "../config/db.js";

const AsignacionLitera = db.define("AsignacionLitera", {
  id_asignacion:  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_litera:      { type: DataTypes.INTEGER, allowNull: false },
  id_beneficiario:{ type: DataTypes.INTEGER, allowNull: false },
  fecha_inicio:   { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin:      { type: DataTypes.DATEONLY, allowNull: true },
  estado:         { type: DataTypes.ENUM("ACTIVA","FINALIZADA"), defaultValue: "ACTIVA" },
}, {
  tableName: "asignaciones_litera",
  timestamps: true,
  underscored: true,
});

export default AsignacionLitera;
