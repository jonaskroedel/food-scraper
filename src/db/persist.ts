import type { PoolClient } from 'pg';
import type { NormalizedProduct } from '../scrapers/scraperTypes';

export async function bulkUpsertProducts(
    products: NormalizedProduct[],
    retailerId: string,
    client: PoolClient
): Promise<number> {
    if (!products.length) return 0;

    const BATCH_SIZE = 250;
    let totalUpserted = 0;

    for (let offset = 0; offset < products.length; offset += BATCH_SIZE) {
        const chunk = products.slice(offset, offset + BATCH_SIZE);

        // Deduplicate in JS by externalId, taking the latest valid item
        const uniqueMap = new Map<string, NormalizedProduct>();
        for (const item of chunk) {
            if (item && item.externalId && item.name) {
                uniqueMap.set(String(item.externalId), item);
            }
        }

        const dedupedChunk = Array.from(uniqueMap.values());
        if (!dedupedChunk.length) continue;

        const jsonPayload = JSON.stringify(dedupedChunk);

        const result = await client.query(`
            WITH raw_input AS (
                SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(
                    "externalId" text, "name" text, "brand" text, "productUrl" text,
                    "price" numeric, "currency" text, "sizeText" text,
                    "normalizedQuantity" numeric, "normalizedUnit" text, "pricePerBase" numeric,
                    "imageUrl" text, "badgeImages" jsonb, "fetchedAt" timestamptz, "raw" jsonb
                )
            ),
            input_data AS (
                SELECT DISTINCT ON ("externalId")
                    "externalId",
                    TRIM("name") AS name,
                    NULLIF(TRIM("brand"), '') AS brand,
                    "productUrl",
                    "price",
                    COALESCE("currency", 'EUR') AS currency,
                    "sizeText",
                    "normalizedQuantity",
                    "normalizedUnit",
                    "pricePerBase",
                    "imageUrl",
                    COALESCE("badgeImages", '{}'::jsonb) AS "badgeImages",
                    COALESCE("fetchedAt", now()) AS "fetchedAt"
                FROM raw_input
                WHERE "name" IS NOT NULL AND TRIM("name") <> ''
            ),
            -- 1. Produkte (Tabelle: product)
            candidate_products AS (
                SELECT DISTINCT ON (name, brand)
                    name AS global_name,
                    brand AS brand_name
                FROM input_data
            ),
            upsert_products AS (
                INSERT INTO product (global_name, brand_name)
                SELECT global_name, brand_name FROM candidate_products
                ON CONFLICT (global_name, brand_name) DO UPDATE SET global_name = EXCLUDED.global_name
                RETURNING id, global_name, brand_name
            ),
            all_products AS (
                SELECT id, global_name, brand_name FROM upsert_products
                UNION
                SELECT p.id, p.global_name, p.brand_name
                FROM product p
                JOIN candidate_products cp ON p.global_name = cp.global_name AND (p.brand_name IS NOT DISTINCT FROM cp.brand_name)
            ),
            -- 2. Angebote (Tabelle: offer)
            upsert_offers AS (
                INSERT INTO offer (product_id, retailer_id, external_product_id, product_url, size_text, unit_quantity, unit, fetched_at)
                SELECT DISTINCT ON (i."externalId")
                    p.id, $2, i."externalId", i."productUrl", i."sizeText", i."normalizedQuantity", i."normalizedUnit", i."fetchedAt"
                FROM input_data i
                    JOIN all_products p ON p.global_name = i.name AND (p.brand_name IS NOT DISTINCT FROM i.brand)
                ON CONFLICT (retailer_id, external_product_id) DO UPDATE SET
                    product_url = EXCLUDED.product_url,
                    size_text = EXCLUDED.size_text,
                    unit_quantity = EXCLUDED.unit_quantity,
                    unit = EXCLUDED.unit,
                    fetched_at = EXCLUDED.fetched_at
                RETURNING id, external_product_id
            ),
            -- 3. Produkt-Bilder (Tabelle: image)
            upsert_product_images AS (
                INSERT INTO image (owner_type, owner_id, url)
                SELECT DISTINCT 'product', p.id, i."imageUrl"
                FROM input_data i
                    JOIN all_products p ON p.global_name = i.name AND (p.brand_name IS NOT DISTINCT FROM i.brand)
                WHERE i."imageUrl" IS NOT NULL
                ON CONFLICT (owner_type, owner_id, url) DO NOTHING
            ),
            -- 4. Badges (Tabelle: badge)
            candidate_badges AS (
                SELECT DISTINCT b.badge_name
                FROM input_data i, jsonb_each_text(i."badgeImages") AS b(badge_name, badge_url)
                WHERE b.badge_name IS NOT NULL AND TRIM(b.badge_name) <> ''
            ),
            upsert_badges AS (
                INSERT INTO badge (name)
                SELECT badge_name FROM candidate_badges
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id, name
            ),
            all_badges AS (
                SELECT id, name FROM upsert_badges
                UNION
                SELECT b.id, b.name FROM badge b
                JOIN candidate_badges cb ON b.name = cb.badge_name
            ),
            -- 5. Badge-Icons
            upsert_badge_icons AS (
                INSERT INTO image (owner_type, owner_id, url)
                SELECT DISTINCT 'badge', b.id, i_data.badge_url
                FROM all_badges b
                    JOIN (
                        SELECT DISTINCT b_inner.badge_name, b_inner.badge_url
                        FROM input_data i_inner, jsonb_each_text(i_inner."badgeImages") AS b_inner(badge_name, badge_url)
                        WHERE b_inner.badge_url IS NOT NULL AND b_inner.badge_url <> ''
                    ) i_data ON i_data.badge_name = b.name
                ON CONFLICT (owner_type, owner_id, url) DO NOTHING
                RETURNING id, owner_id
            ),
            -- 6. Link Badges
            link_badge_images AS (
                INSERT INTO badge_image (badge_id, image_id)
                SELECT owner_id, id FROM upsert_badge_icons
                ON CONFLICT DO NOTHING
            ),
            link_offer_badges AS (
                INSERT INTO offer_badge (offer_id, badge_id)
                SELECT DISTINCT o.id, b.id
                FROM input_data i
                    JOIN upsert_offers o ON o.external_product_id = i."externalId"
                    CROSS JOIN LATERAL jsonb_each_text(i."badgeImages") AS bt(badge_name, badge_url)
                    JOIN all_badges b ON b.name = bt.badge_name
                ON CONFLICT DO NOTHING
            ),
            -- 7. Preise (Tabelle: price)
            insert_prices AS (
                INSERT INTO price (offer_id, price, currency, base_price, base_unit, valid_from)
                SELECT o.id, i.price, i.currency, i."pricePerBase",
                    CASE
                        WHEN i."normalizedUnit" = 'g' THEN 'kg'
                        WHEN i."normalizedUnit" = 'ml' THEN 'l'
                        ELSE 'stk'
                    END,
                    i."fetchedAt"
                FROM input_data i
                    JOIN upsert_offers o ON o.external_product_id = i."externalId"
                WHERE i.price IS NOT NULL
            )
            SELECT count(*)::int AS count FROM upsert_offers;
        `, [jsonPayload, retailerId]);

        totalUpserted += Number(result.rows[0]?.count ?? 0);
    }

    return totalUpserted;
}
