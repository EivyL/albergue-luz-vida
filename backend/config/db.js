import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  pool: { max: 8, min: 0, idle: 10000, acquire: 20000, evict: 1000 },
  dialectOptions: {
    keepAlive: true,
    // ❌ NO forzar SSL cuando usas la URL interna de Render
    // ssl: { require: true }
  },
});

export default sequelize;
