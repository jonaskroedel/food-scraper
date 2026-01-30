import { NormalizedProduct } from './spar.types.js';
import { diffOffer } from './spar.diff.js';
import type { PoolClient } from 'pg';

const badgeCache = new Map<string, string>();
const categoryCache = new Map<string, string>();

export type UpsertResult =
    | { status: 'inserted' }
    | { status: 'skipped' }
    | { status: 'updated'; diff: { field: string; before: any; after: any }[] };

// 🖼 SPAR image template resolver
function resolveSparImageUrl(
    template?: string,
    size = 500,
    ext = 'png'
): string | null {
    if (!template) return null;

    return template
        .replace('{size}', String(size))
        .replace('{ext}', ext);
}

export async function upsertSparProduct(
    p: NormalizedProduct,
    retailerId: string,
    client: PoolClient
): Promise<UpsertResult> {

    // 🔍 lookup existing offer (⚠️ inkl. Produktbild!)
    const existingOfferRes = await client.query(
        `
            SELECT
                o.id,
                o.product_id,
                o.product_url,
                o.size_text,
                o.unit_quantity,
                o.unit,

                (
                    SELECT i.url
                    FROM image i
                    WHERE i.owner_type = 'product'
                      AND i.owner_id = o.product_id
                    ORDER BY i.created_at DESC
                    LIMIT 1
                ) AS product_image_url

            FROM offer o
            WHERE o.retailer_id = $1
              AND o.external_product_id = $2
        `,
        [retailerId, p.externalId]
    );

    const existingOffer = existingOfferRes.rows[0] ?? null;

    // ⏭ skip if unchanged (inkl. Bild!)
    const diff = diffOffer(existingOffer, p);

    if (existingOffer && !diff.changed) {
        return { status: 'skipped' };
    }

    // 📦 product
    let productId: string;

    if (existingOffer) {
        productId = existingOffer.product_id;
    } else {
        const productRes = await client.query(
            `
                INSERT INTO product (global_name, brand_name)
                VALUES ($1,$2)
                    RETURNING id
            `,
            [p.name, p.brand]
        );
        productId = productRes.rows[0].id;
    }

    // 🖼 PRODUCT IMAGE (owner = product)
    const productImageTemplate = p.raw?.masterValues?.productImage_assetUrl;
    const productImageUrl = resolveSparImageUrl(productImageTemplate, 500, 'png');

    if (productImageUrl) {
        await client.query(
            `
                INSERT INTO image (
                    owner_type,
                    owner_id,
                    url,
                    alt_text,
                    width,
                    height
                )
                VALUES ($1,$2,$3,$4,$5,$6)
                    ON CONFLICT DO NOTHING
            `,
            [
                'product',
                productId,
                productImageUrl,
                p.name,
                500,
                500,
            ]
        );
    }

    // 🛒 offer
    const offerRes = await client.query(
        `
            INSERT INTO offer (
                product_id,
                retailer_id,
                external_product_id,
                product_url,
                size_text,
                unit_quantity,
                unit,
                is_bulk,
                fetched_at
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                ON CONFLICT (retailer_id, external_product_id)
        DO UPDATE SET
                product_url = EXCLUDED.product_url,
                               size_text = EXCLUDED.size_text,
                               unit_quantity = EXCLUDED.unit_quantity,
                               unit = EXCLUDED.unit,
                               fetched_at = EXCLUDED.fetched_at
                               RETURNING id
        `,
        [
            productId,
            retailerId,
            p.externalId,
            p.productUrl,
            p.sizeText,
            p.normalizedQuantity,
            p.normalizedUnit,
            false,
            p.fetchedAt,
        ]
    );

    const offerId = offerRes.rows[0].id;

    // 🏷 BADGES + IMAGES (unverändert)
    for (const badgeName of p.badges ?? []) {
        let badgeId = badgeCache.get(badgeName);

        if (!badgeId) {
            const badgeRes = await client.query(
                `
                    INSERT INTO badge (name)
                    VALUES ($1)
                        ON CONFLICT (name)
                DO UPDATE SET name = EXCLUDED.name
                                               RETURNING id
                `,
                [badgeName]
            );

            badgeId = badgeRes.rows[0]?.id;
            if (!badgeId) {
                throw new Error(`Failed to resolve badgeId for badge "${badgeName}"`);
            }

            badgeCache.set(badgeName, badgeId);
        }

        const imageUrl = p.badgeImages?.[badgeName];
        if (imageUrl) {
            await client.query(
                `
                    INSERT INTO image (
                        owner_type,
                        owner_id,
                        url,
                        alt_text,
                        width,
                        height
                    )
                    VALUES ($1,$2,$3,$4,$5,$6)
                        ON CONFLICT DO NOTHING
                `,
                [
                    'badge',
                    badgeId,
                    imageUrl,
                    badgeName,
                    50,
                    50,
                ]
            );
        }

        await client.query(
            `
                INSERT INTO offer_badge (offer_id, badge_id)
                VALUES ($1,$2)
                    ON CONFLICT DO NOTHING
            `,
            [offerId, badgeId]
        );
    }

    // 📂 CATEGORIES (unverändert)
    for (const path of p.categoryPaths ?? []) {
        let categoryId = categoryCache.get(path);

        if (!categoryId) {
            const categoryRes = await client.query(
                `
                    INSERT INTO category (
                        retailer_id,
                        external_category_id,
                        name,
                        path
                    )
                    VALUES ($1,$2,$3,$4)
                        ON CONFLICT (retailer_id, external_category_id)
                DO UPDATE SET name = EXCLUDED.name
                                               RETURNING id
                `,
                [
                    retailerId,
                    path,
                    path.split('/').pop(),
                    path,
                ]
            );

            categoryId = categoryRes.rows[0]?.id;
            if (!categoryId) {
                throw new Error(`Failed to resolve categoryId for path "${path}"`);
            }

            categoryCache.set(path, categoryId);
        }

        await client.query(
            `
                INSERT INTO offer_category (offer_id, category_id)
                VALUES ($1,$2)
                    ON CONFLICT DO NOTHING
            `,
            [offerId, categoryId]
        );
    }

    // 💰 PRICE (append-only, unverändert)
    if (p.price !== null) {
        await client.query(
            `
                INSERT INTO price (
                    offer_id,
                    price,
                    currency,
                    base_price,
                    base_unit,
                    valid_from
                )
                VALUES ($1,$2,$3,$4,$5,now())
            `,
            [
                offerId,
                p.price,
                p.currency ?? 'EUR',
                p.pricePerBase,
                p.normalizedUnit === 'g'
                    ? 'kg'
                    : p.normalizedUnit === 'ml'
                        ? 'l'
                        : 'stk',
            ]
        );
    }

    // 🧾 RAW PAYLOAD
    await client.query(
        `
            INSERT INTO raw_source_payload
                (offer_id, retailer_code, payload, fetched_at)
            VALUES ($1,$2,$3,now())
        `,
        [offerId, 'SPAR', p.raw]
    );

    return existingOffer
        ? { status: 'updated', diff: diff.fields }
        : { status: 'inserted' };
}
