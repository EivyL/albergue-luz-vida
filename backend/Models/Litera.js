import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Litera = db.define("Litera", {
  id_litera: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo:    { type: DataTypes.STRING(20), allowNull: false, unique: true },
  area:      { type: DataTypes.STRING(50) },
  piso:      { type: DataTypes.INTEGER },
  estado:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: "literas",

  underscored: true,
});

export default Litera;
