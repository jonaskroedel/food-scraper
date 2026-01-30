export async function bulkUpsertSparProducts(
    products: NormalizedProduct[],
    retailerId: string,
    client: PoolClient
) {
    const jsonPayload = JSON.stringify(products);

    await client.query(`
        WITH input_data AS (
            SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(
                                                             "externalId" text, "name" text, "brand" text, "productUrl" text,
                                                             "price" numeric, "currency" text, "sizeText" text,
                                                             "normalizedQuantity" numeric, "normalizedUnit" text, "pricePerBase" numeric,
                                                             "imageUrl" text, "badgeImages" jsonb, "fetchedAt" timestamptz, "raw" jsonb
                )
        ),
             -- 1. Produkte (Tabelle: product)
             upsert_products AS (
        INSERT INTO product (global_name, brand_name)
        SELECT DISTINCT name, brand FROM input_data
            ON CONFLICT (global_name, brand_name) DO UPDATE SET global_name = EXCLUDED.global_name
                                                         RETURNING id, global_name, brand_name
                                                         ),
                                                         -- 2. Angebote (Tabelle: offer)
                                                         upsert_offers AS (
                                                     INSERT INTO offer (product_id, retailer_id, external_product_id, product_url, fetched_at)
                                                     SELECT p.id, $2, i."externalId", i."productUrl", i."fetchedAt"
                                                     FROM input_data i
                                                         JOIN upsert_products p ON p.global_name = i.name AND (p.brand_name IS NOT DISTINCT FROM i.brand)
                                                         ON CONFLICT (retailer_id, external_product_id) DO UPDATE SET fetched_at = EXCLUDED.fetched_at
                RETURNING id, external_product_id
                ),
                                                                                                               -- 3. PRODUKT-BILDER (Wieder eingefügt!)
                upsert_product_images AS (
                                                     INSERT INTO image (owner_type, owner_id, url)
                                                     SELECT DISTINCT 'product', p.id, i."imageUrl"
                                                     FROM input_data i
                                                         JOIN upsert_products p ON p.global_name = i.name AND (p.brand_name IS NOT DISTINCT FROM i.brand)
                                                     WHERE i."imageUrl" IS NOT NULL
                                                     ON CONFLICT (owner_type, owner_id, url) DO NOTHING
                                                         ),
                                                         -- 4. Badges (Tabelle: badge)
                                                         upsert_badges AS (
                                                     INSERT INTO badge (name)
                                                     SELECT DISTINCT b.badge_name
                                                     FROM input_data i, jsonb_each_text(i."badgeImages") AS b(badge_name, badge_url)
                                                     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                                                         RETURNING id, name
                                                         ),
                                                                               -- 5. Badge-Icons (Tabelle: image mit owner_type 'badge')
                                                         upsert_badge_icons AS (
                                                     INSERT INTO image (owner_type, owner_id, url)
                                                     SELECT DISTINCT 'badge', b.id, i_data.badge_url
                                                     FROM upsert_badges b
                                                         JOIN (
                                                         SELECT DISTINCT b_inner.badge_name, b_inner.badge_url
                                                         FROM input_data i_inner, jsonb_each_text(i_inner."badgeImages") AS b_inner(badge_name, badge_url)
                                                         ) i_data ON i_data.badge_name = b.name
                                                         ON CONFLICT (owner_type, owner_id, url) DO NOTHING
                                                         RETURNING id, owner_id
                                                         ),
                                                         -- 6. Join-Tabellen für Badges (badge_image & offer_badge)
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
                                                         JOIN upsert_badges b ON b.name = bt.badge_name
                                                         ON CONFLICT DO NOTHING
                                                         ),
                                                         -- 7. Preise (Tabelle: price)
                                                         insert_prices AS (
                                                     INSERT INTO price (offer_id, price, currency, base_price, base_unit, valid_from)
                                                     SELECT o.id, i.price, COALESCE(i.currency, 'EUR'), i."pricePerBase",
                                                         CASE WHEN i."normalizedUnit" = 'g' THEN 'kg' WHEN i."normalizedUnit" = 'ml' THEN 'l' ELSE 'stk' END,
                                                         i."fetchedAt"
                                                     FROM input_data i
                                                         JOIN upsert_offers o ON o.external_product_id = i."externalId"
                                                     WHERE i.price IS NOT NULL
                                                         )
        SELECT count(*) FROM upsert_offers; -- Nur für das Result-Set
    `, [jsonPayload, retailerId]);
}