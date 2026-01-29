import { pg } from './pg.js';

export async function checkDb() {
    const res = await pg.query('select 1 as ok');
    if (res.rows[0]?.ok !== 1) {
        throw new Error('DB health check failed');
    }
}