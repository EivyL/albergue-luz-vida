// backend/config/db.js (ESM)
import 'dotenv/config';           // <-- carga .env automáticamente
import { Sequelize } from 'sequelize';

const {
  DATABASE_URL,          // p.ej. postgres://user:pass@host:5432/dbname
  DB_HOST,
  DB_PORT = '5432',
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_SSL = 'false',      // "true" si tu proveedor exige SSL (Railway/Render/Heroku)
  DB_SCHEMA = 'public',  // opcional si usas otro schema
  NODE_ENV,
} = process.env;

const sslEnabled = DB_SSL === 'true';

// Pequeña ayuda para logs útiles
const printWhere = () => {
  if (DATABASE_URL) return `DATABASE_URL (${NODE_ENV || 'dev'})`;
  return `${DB_USER}@${DB_HOST}/${DB_NAME} (${NODE_ENV || 'dev'})`;
};

let sequelize;

if (DATABASE_URL && DATABASE_URL.trim() !== '') {
  // Conexión por URL
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    define: { underscored: true, schema: DB_SCHEMA },
    dialectOptions: sslEnabled ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  });
} else {
  // Conexión por parámetros sueltos
  if (!DB_HOST || !DB_NAME || !DB_USER) {
    throw new Error(
      'Config DB inválida: falta DATABASE_URL o (DB_HOST, DB_NAME, DB_USER). ' +
      'Revisa tu archivo .env.'
    );
  }

  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS ?? '', {
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: 'postgres',
    logging: false,
    define: { underscored: true, schema: DB_SCHEMA },
    dialectOptions: sslEnabled ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  });
}

// (Opcional) fija el search_path si usas un schema distinto a public
async function setSearchPathIfNeeded() {
  if (DB_SCHEMA && DB_SCHEMA !== 'public') {
    await sequelize.query(`SET search_path TO ${DB_SCHEMA}, public;`);
  }
}

// Helper para arrancar la conexión desde server.js
export async function initDb() {
  console.log('Conectando a BD ->', printWhere(), ' SSL:', sslEnabled, ' Schema:', DB_SCHEMA);
  await sequelize.authenticate();
  await setSearchPathIfNeeded();
  console.log('DB OK');
  return sequelize;
}

export default sequelize;
