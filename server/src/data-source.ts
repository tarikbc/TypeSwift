import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "./entity/User";
import dotenv from 'dotenv';

dotenv.config();

let dataSourceConfig: DataSourceOptions;

// Check if DATABASE_URL is provided (Railway and other PaaS providers use this)
if (process.env.DATABASE_URL) {
  dataSourceConfig = {
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: true, // Auto-creates database schema. Consider setting to false in production with migrations
    logging: process.env.NODE_ENV !== 'production',
    entities: [User],
    migrations: [],
    subscribers: [],
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
} else {
  // Default to individual connection parameters if DATABASE_URL is not provided
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;
  const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
  const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
  const DB_DATABASE = process.env.DB_DATABASE || 'typeswift';

  dataSourceConfig = {
    type: "postgres",
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    synchronize: true, // Auto-creates database schema in development
    logging: process.env.NODE_ENV !== 'production',
    entities: [User],
    migrations: [],
    subscribers: [],
  };
}

export const AppDataSource = new DataSource(dataSourceConfig);
