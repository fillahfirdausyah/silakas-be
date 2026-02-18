import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config();

// In dev: __dirname = <root>/typeorm → rootDir = <root>
// In prod: __dirname = <root>/dist/typeorm → rootDir = <root>/dist
const rootDir = path.resolve(__dirname, '..');

const options: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [path.join(rootDir, 'src/entities/**/*.{ts,js}')],
    migrations: [path.join(rootDir, 'typeorm/migrations/*.{ts,js}')],
    migrationsTableName: '_typeorm_migrations',
    migrationsTransactionMode: 'each',
    logging: true,
    synchronize: false,
};
export const dataSource = new DataSource(options);
