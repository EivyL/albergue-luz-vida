import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: process.env.DB_DIALECT || "postgres",
    logging: false,
    pool: {
      max: 10,      // suficiente para dev
      min: 0,
      idle: 10000,  // libera conexiones ociosas
      acquire: 20000, // evita esperas eternas
      evict: 1000,
    },
    dialectOptions: {
      // útil en redes inestables
      keepAlive: true,
    },
  }
);
export default sequelize;
