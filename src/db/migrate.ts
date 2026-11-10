import { pg } from './pg';
import { ensureSchema } from './ensureSchema';
import { logger } from '../utils/logger';

export async function migrate() {
    logger.info('Starting database migration...');
    const client = await pg.connect();

    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE EXTENSION IF NOT EXISTS "citext";
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            CREATE TABLE IF NOT EXISTS retailer (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                country TEXT DEFAULT 'AT' NOT NULL,
                website_url TEXT,
                created_at TIMESTAMPTZ DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS product (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                global_name TEXT NOT NULL,
                brand_name TEXT,
                description_text TEXT,
                ingredients_text TEXT,
                nutrition_text TEXT,
                allergen_text TEXT,
                origin_text TEXT,
                extra_attributes JSONB,
                created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS offer (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
                retailer_id UUID NOT NULL REFERENCES retailer(id) ON DELETE CASCADE,
                external_product_id TEXT NOT NULL,
                product_url TEXT,
                size_text TEXT,
                unit_quantity NUMERIC,
                unit TEXT,
                is_bulk BOOLEAN,
                fetched_at TIMESTAMPTZ NOT NULL,
                CONSTRAINT offer_retailer_external_id_key UNIQUE (retailer_id, external_product_id)
            );

            CREATE TABLE IF NOT EXISTS price (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                offer_id UUID NOT NULL REFERENCES offer(id) ON DELETE CASCADE,
                price NUMERIC NOT NULL,
                currency TEXT NOT NULL,
                base_price NUMERIC,
                base_unit TEXT,
                old_price NUMERIC,
                discount_text TEXT,
                valid_from TIMESTAMPTZ,
                valid_to TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS badge (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL UNIQUE,
                badge_type TEXT,
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS image (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_type TEXT NOT NULL CHECK (owner_type IN ('product', 'offer', 'badge')),
                owner_id UUID NOT NULL,
                url TEXT NOT NULL,
                alt_text TEXT,
                width INT,
                height INT,
                created_at TIMESTAMPTZ DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS badge_image (
                badge_id UUID NOT NULL REFERENCES badge(id) ON DELETE CASCADE,
                image_id UUID NOT NULL REFERENCES image(id) ON DELETE CASCADE,
                PRIMARY KEY (badge_id, image_id)
            );

            CREATE TABLE IF NOT EXISTS offer_badge (
                offer_id UUID NOT NULL REFERENCES offer(id) ON DELETE CASCADE,
                badge_id UUID NOT NULL REFERENCES badge(id) ON DELETE CASCADE,
                PRIMARY KEY (offer_id, badge_id)
            );

            CREATE TABLE IF NOT EXISTS category (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                retailer_id UUID NOT NULL REFERENCES retailer(id) ON DELETE CASCADE,
                external_category_id TEXT,
                name TEXT NOT NULL,
                path TEXT,
                parent_id UUID REFERENCES category(id) ON DELETE SET NULL,
                CONSTRAINT category_retailer_external_key UNIQUE (retailer_id, external_category_id)
            );

            CREATE TABLE IF NOT EXISTS offer_category (
                offer_id UUID NOT NULL REFERENCES offer(id) ON DELETE CASCADE,
                category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
                PRIMARY KEY (offer_id, category_id)
            );

            CREATE TABLE IF NOT EXISTS raw_source_payload (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                offer_id UUID NOT NULL REFERENCES offer(id) ON DELETE CASCADE,
                retailer_code TEXT NOT NULL,
                payload JSONB NOT NULL,
                fetched_at TIMESTAMPTZ NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_offer_product ON offer(product_id);
            CREATE INDEX IF NOT EXISTS idx_offer_retailer ON offer(retailer_id);
            CREATE INDEX IF NOT EXISTS idx_price_offer ON price(offer_id);
        `);

        await client.query('COMMIT');
        logger.success('Base tables and indexes verified.');

        // Now run ensureSchema to verify constraints and seed retailers
        await ensureSchema();
        logger.success('Schema migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error('Migration failed:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Allow CLI execution: npx tsx src/db/migrate.ts
if (process.argv[1]?.endsWith('migrate.ts')) {
    migrate()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
