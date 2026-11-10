export interface QueryFilters {
    cursor?: string | null;
    limit?: number;
    search?: string | null;
    retailer?: string | null;
    onlyBio?: boolean;
    sortBy?: 'price_asc' | 'price_desc' | 'base_price_asc' | 'name_asc' | null;
}

export function buildProductsQuery(filters: QueryFilters) {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Search query (name or brand)
    if (filters.search && filters.search.trim()) {
        values.push(`%${filters.search.trim()}%`);
        conditions.push(`(p.global_name ILIKE $${paramIndex} OR p.brand_name ILIKE $${paramIndex})`);
        paramIndex++;
    }

    // Retailer filter
    if (filters.retailer && filters.retailer !== 'ALL') {
        values.push(filters.retailer.toUpperCase());
        conditions.push(`r.code = $${paramIndex}`);
        paramIndex++;
    }

    // Bio filter
    if (filters.onlyBio) {
        conditions.push(`(
            p.global_name ILIKE '%bio%' OR
            p.brand_name ILIKE '%bio%' OR
            EXISTS (
                SELECT 1 FROM offer_badge ob2
                JOIN badge b2 ON b2.id = ob2.badge_id
                WHERE ob2.offer_id = o.id AND b2.name ILIKE '%bio%'
            )
        )`);
    }

    // Cursor pagination
    if (filters.cursor) {
        values.push(filters.cursor);
        conditions.push(`p.id > $${paramIndex}::uuid`);
        paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Ordering
    let orderBy = 'ORDER BY p.id ASC';
    if (filters.sortBy === 'price_asc') {
        orderBy = 'ORDER BY MIN(pr.price) ASC NULLS LAST, p.id ASC';
    } else if (filters.sortBy === 'price_desc') {
        orderBy = 'ORDER BY MAX(pr.price) DESC NULLS LAST, p.id ASC';
    } else if (filters.sortBy === 'base_price_asc') {
        orderBy = 'ORDER BY MIN(pr.base_price) ASC NULLS LAST, p.id ASC';
    } else if (filters.sortBy === 'name_asc') {
        orderBy = 'ORDER BY p.global_name ASC, p.id ASC';
    }

    values.push(filters.limit ?? 30);
    const limitPlaceholder = `$${paramIndex}`;

    const sql = `
        SELECT
            p.id,
            p.global_name,
            p.brand_name,
            COALESCE(
                MIN(pi.url),
                MIN(oi.url)
            ) AS image_url,
            json_agg(
                DISTINCT jsonb_build_object(
                    'offer_id', o.id,
                    'retailer_name', r.display_name,
                    'product_url', o.product_url,
                    'price', pr.price,
                    'currency', pr.currency,
                    'base_price', pr.base_price,
                    'base_unit', pr.base_unit,
                    'size_text', o.size_text
                )
            ) FILTER (WHERE pr.price IS NOT NULL) AS offers,
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'id', b.id,
                    'name', b.name,
                    'image_url', bi.url
                )
            ) FILTER (WHERE b.id IS NOT NULL) AS badges
        FROM product p
            JOIN offer o ON o.product_id = p.id
            JOIN retailer r ON r.id = o.retailer_id
            LEFT JOIN LATERAL (
                SELECT price, currency, base_price, base_unit
                FROM price
                WHERE offer_id = o.id
                ORDER BY created_at DESC
                LIMIT 1
            ) pr ON true
            LEFT JOIN image pi ON pi.owner_type = 'product' AND pi.owner_id = p.id
            LEFT JOIN image oi ON oi.owner_type = 'offer' AND oi.owner_id = o.id
            LEFT JOIN offer_badge ob ON ob.offer_id = o.id
            LEFT JOIN badge b ON b.id = ob.badge_id
            LEFT JOIN image bi ON bi.owner_type = 'badge' AND bi.owner_id = b.id
        ${whereClause}
        GROUP BY p.id
        ${orderBy}
        LIMIT ${limitPlaceholder};
    `;

    return { sql, values };
}
