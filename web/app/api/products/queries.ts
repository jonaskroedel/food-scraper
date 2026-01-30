export const PRODUCTS_PAGE = `
    SELECT
        p.id,
        p.global_name,
        p.brand_name,

        COALESCE(
                MIN(pi.url),
                MIN(oi.url)
        ) AS image_url,

        json_agg(
                jsonb_build_object(
                        'offer_id', o.id,
                        'retailer_name', r.display_name,
                        'product_url', o.product_url,
                        'price', pr.price,
                        'currency', pr.currency,
                        'base_price', pr.base_price,
                        'base_unit', pr.base_unit,
                        'size_text', o.size_text
                )
                    ORDER BY pr.price
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

        LEFT JOIN image pi
        ON pi.owner_type = 'product'
        AND pi.owner_id = p.id

        LEFT JOIN image oi
        ON oi.owner_type = 'offer'
        AND oi.owner_id = o.id

        LEFT JOIN offer_badge ob ON ob.offer_id = o.id
        LEFT JOIN badge b ON b.id = ob.badge_id
        LEFT JOIN image bi
        ON bi.owner_type = 'badge'
        AND bi.owner_id = b.id

    WHERE ($1::uuid IS NULL OR p.id > $1)
    GROUP BY p.id
    ORDER BY p.id
        LIMIT $2;
`
