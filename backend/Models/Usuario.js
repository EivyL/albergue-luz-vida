// backend/Models/Usuario.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Mantiene los nombres de ATRIBUTOS que ya usa tu app:
 *  - id_usuario   -> columna real: id
 *  - nombre_usuario -> columna real: nombre
 *  - rol          -> columna real: rol_id (INTEGER)
 *  - estado       -> columna real: activo
 *
 * OJO: ahora "rol" (atributo) es INTEGER internamente (id del rol).
 * Si en algún punto comparabas strings ("ADMIN", "STAFF", ...),
 * tendrás que mapear esos textos al id correspondiente en la tabla roles.
 */
const Usuario = sequelize.define(
  "Usuario",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id", // <- columna real
    },
    nombre_usuario: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true, // si no existe constraint en BD, no pasa nada (no sincronizamos)
      field: "nombre",
    },
    correo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      field: "correo",
    },
    contrasena: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "contrasena",
    },
    // IMPORTANTE: ahora 'rol' es INTEGER (mapea a rol_id en la BD)
    rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "rol_id",
    },
    // 'estado' en el modelo mapea a 'activo' en la tabla
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: "activo",
    },
    ultimo_login: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "ultimo_login",
    },
  },
  {
    tableName: "usuarios",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Usuario;
