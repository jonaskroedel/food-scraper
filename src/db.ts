import pg from 'pg';
const { Pool } = pg;

const poolConfig = {
    host: '192.168.1.101',
    port: 43143,
    database: 'food_compare',
    user: 'postgres',
    password: 'root',
};

const globalForDb = global as unknown as { db: pg.Pool };

export const db = globalForDb.db || new Pool(poolConfig);

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;