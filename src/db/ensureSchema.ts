import { pg } from './pg';
import { KNOWN_RETAILERS } from './getRetailerId';

export async function ensureSchema() {
    const client = await pg.connect();

    try {
        await client.query('BEGIN');

        // ─────────────────────────────────────────
        // Seed standard Austrian retailers
        // ─────────────────────────────────────────
        for (const r of Object.values(KNOWN_RETAILERS)) {
            await client.query(
                `
                INSERT INTO retailer (code, display_name, country, website_url)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (code) DO UPDATE SET
                    display_name = EXCLUDED.display_name,
                    country = EXCLUDED.country,
                    website_url = EXCLUDED.website_url
                `,
                [r.code, r.displayName, r.country, r.websiteUrl]
            );
        }

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

        // ─────────────────────────────────────────
        // product: ensure unique constraint for upsert
        // ─────────────────────────────────────────
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'product_global_name_brand_unique'
                ) THEN
                    BEGIN
                        ALTER TABLE product
                        ADD CONSTRAINT product_global_name_brand_unique UNIQUE NULLS NOT DISTINCT (global_name, brand_name);
                    EXCEPTION WHEN OTHERS THEN
                        ALTER TABLE product
                        ADD CONSTRAINT product_global_name_brand_unique UNIQUE (global_name, brand_name);
                    END;
                END IF;
            END $$;
        `);

        // ─────────────────────────────────────────
        // image: ensure unique constraint on (owner_type, owner_id, url)
        // ─────────────────────────────────────────
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'image_owner_url_unique'
                ) THEN
                    ALTER TABLE image
                    ADD CONSTRAINT image_owner_url_unique UNIQUE (owner_type, owner_id, url);
                END IF;
            END $$;
        `);

        // ─────────────────────────────────────────
        // Search indexes for performant querying
        // ─────────────────────────────────────────
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_product_global_name ON product(global_name);
            CREATE INDEX IF NOT EXISTS idx_product_brand_name ON product(brand_name);
            CREATE INDEX IF NOT EXISTS idx_price_created_at ON price(created_at DESC);
        `);

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}
