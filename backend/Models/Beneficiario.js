// Models/Beneficiario.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Beneficiario = sequelize.define("Beneficiario", {
  id_beneficiario: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: DataTypes.STRING,
  apellido: DataTypes.STRING,
  sexo: DataTypes.ENUM("H","M"),
  documento: DataTypes.STRING,
  fecha_nacimiento: DataTypes.DATE,        // puede ser null
  nacionalidad: DataTypes.STRING,
  fecha_ingreso: DataTypes.DATE,
  fecha_salida: DataTypes.DATE,
  motivo_ingreso: DataTypes.STRING,
  programa: DataTypes.STRING,
  telefono: DataTypes.STRING,
  direccion: DataTypes.STRING,
  emerg_nombre: DataTypes.STRING,
  emerg_parentesco: DataTypes.STRING,
  emerg_telefono: DataTypes.STRING,
  alergias: DataTypes.STRING,
  enfermedades: DataTypes.STRING,
  medicamentos: DataTypes.STRING,
  discapacidad: DataTypes.STRING,
  ocupacion: DataTypes.STRING,
  observaciones: DataTypes.TEXT,
  estado: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: "beneficiarios",
  timestamps: false,         // <- obliga a tener created_at / updated_at
  underscored: true,        // <- nombres con underscore
});
export default Beneficiario;
