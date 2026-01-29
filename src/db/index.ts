import { Pool } from 'pg';

export const db = new Pool({
    host: '192.168.1.101',
    port: 43143,
    user: 'postgres',
    password: 'root',
    database: 'price_compare',
});

db.on('connect', () => {
    console.log('🟢 Connected to Postgres');
});