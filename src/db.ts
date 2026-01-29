import { Pool } from 'pg';

export const db = new Pool({
    host: '192.168.1.101',
    port: 43143,
    database: 'food_scraper',
    user: 'postgres',
    password: 'root',
});