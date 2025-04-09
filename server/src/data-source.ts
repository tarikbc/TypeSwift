import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import dotenv from 'dotenv';

dotenv.config();

// Default to localhost if no environment variable is provided
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_DATABASE = process.env.DB_DATABASE || 'typeswift';

export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  synchronize: true, // Auto-creates database schema in development. Set to false in production
  logging: process.env.NODE_ENV !== 'production',
  entities: [User],
  migrations: [],
  subscribers: [],
});
