// backend/Models/index.js
import db from "../config/db.js";
import Beneficiario from "./Beneficiario.js";
import Habitacion from "./Habitacion.js";
import Cama from "./Cama.js";
import InventarioItem from "./InventarioItem.js";
import InventarioMovimiento from "./InventarioMovimiento.js";

// Habitacion ↔ Cama
Habitacion.hasMany(Cama, { as: "camas", foreignKey: "id_habitacion" });
Cama.belongsTo(Habitacion, { as: "habitacion", foreignKey: "id_habitacion" });

// Beneficiario ↔ Cama
Beneficiario.hasOne(Cama, { as: "cama", foreignKey: "id_beneficiario" });
Cama.belongsTo(Beneficiario, { as: "beneficiario", foreignKey: "id_beneficiario" });

// InventarioItem ↔ InventarioMovimiento
InventarioItem.hasMany(InventarioMovimiento, {
  as: "movimientos",
  foreignKey: "item_id",
});
InventarioMovimiento.belongsTo(InventarioItem, {
  as: "item",
  foreignKey: "item_id",
});

// Exporta TODO siguiendo tu estilo:
export {
  db,
  Beneficiario,
  Habitacion,
  Cama,
  InventarioItem,
  InventarioMovimiento,
};

