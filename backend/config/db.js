import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || "albergue.db",
  process.env.DB_USER || "postgres",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5474,
    dialect: "postgres",
    logging: false,
  }
);

export default sequelize;
