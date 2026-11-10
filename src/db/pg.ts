import pgPkg from 'pg';
const { Pool } = pgPkg;
import { ENV } from '../env';

export const pg = new Pool(
    ENV.db.connectionString
        ? {
              connectionString: ENV.db.connectionString,
              ssl: ENV.db.ssl ? { rejectUnauthorized: false } : false,
              connectionTimeoutMillis: 1500,
          }
        : {
              host: ENV.db.host,
              port: ENV.db.port,
              database: ENV.db.name,
              user: ENV.db.user,
              password: ENV.db.pass,
              ssl: ENV.db.ssl ? { rejectUnauthorized: false } : false,
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 1500,
          }
);

export const db = pg;
