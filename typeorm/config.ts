import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config();

const options: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: ['src/entities/**/*.ts'],
    migrations: ['typeorm/migrations/*.ts'],
    migrationsTableName: '_typeorm_migrations',
    migrationsTransactionMode: 'each',
    logging: true,
    synchronize: false,
};
export const dataSource = new DataSource(options);
