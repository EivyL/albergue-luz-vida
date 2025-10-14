// Models/Compra.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Compra = sequelize.define('Compra', {
  id_compra:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  proveedor_id: { type: DataTypes.INTEGER },            // existe en tu BD
  fecha:        { type: DataTypes.DATEONLY, allowNull: false },
  total:        { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  estado:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'compras',
  freezeTableName: true,
  timestamps: true,
  underscored: true,
});

export default Compra;
