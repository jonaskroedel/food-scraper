import { pg } from './pg.js';

export async function getRetailerId(): Promise<string> {
    const client = await pg.connect();
    try {
        const res = await client.query(
            `
            INSERT INTO retailer (code, display_name, country, website_url)
            VALUES ($1,$2,$3,$4)
            ON CONFLICT (code)
            DO UPDATE SET
                display_name = EXCLUDED.display_name,
                country = EXCLUDED.country,
                website_url = EXCLUDED.website_url
            RETURNING id
            `,
            ['SPAR', 'SPAR Österreich', 'AT', 'https://www.spar.at']
        );
        return res.rows[0].id;
    } finally {
        client.release();
    }
}