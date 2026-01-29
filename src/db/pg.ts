import { Pool } from 'pg';
import { ENV } from '../env.js';

export const pg = new Pool({
    host: ENV.db.host,
    port: ENV.db.port,
    database: ENV.db.name,
    user: ENV.db.user,
    password: ENV.db.pass,
    ssl: ENV.db.ssl ? { rejectUnauthorized: false } : false,
});