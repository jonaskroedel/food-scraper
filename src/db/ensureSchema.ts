import { pg } from './pg.js';

export async function ensureSchema() {
    const client = await pg.connect();

    try {
        await client.query('BEGIN');

        // ─────────────────────────────────────────
        // retailer
        // ─────────────────────────────────────────
        await client.query(`
            INSERT INTO retailer (code, display_name, country, website_url)
            VALUES ('SPAR', 'SPAR Österreich', 'AT', 'https://www.spar.at')
            ON CONFLICT (code) DO NOTHING
        `);

        // ─────────────────────────────────────────
        // badge: ensure name column + unique
        // ─────────────────────────────────────────
        await client.query(`
            ALTER TABLE badge
            ADD COLUMN IF NOT EXISTS name TEXT
        `);

        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'badge_name_unique'
                ) THEN
                    ALTER TABLE badge
                    ADD CONSTRAINT badge_name_unique UNIQUE (name);
                END IF;
            END $$;
        `);

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}