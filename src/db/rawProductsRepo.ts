import { pool } from '../config/db.js';
import { RawProduct } from '../types/rawProduct.js';

export async function insertRawProduct(p: RawProduct) {
    await pool.query(
        `
    INSERT INTO raw.products (
      chain, external_id,
      raw_name, raw_price, raw_unit_price,
      raw_weight_text, raw_category,
      raw_ingredients, raw_nutrition,
      raw_payload, product_url, scraped_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
    )
    ON CONFLICT (chain, external_id) DO NOTHING
    `,
        [
            p.chain,
            p.externalId,
            p.rawName,
            p.rawPrice,
            p.rawUnitPrice,
            p.rawWeightText,
            p.rawCategory,
            p.rawIngredients,
            p.rawNutrition,
            p.rawPayload,
            p.productUrl,
            p.scrapedAt
        ]
    );
}
