import { pg } from './pg';

export interface RetailerInfo {
    code: string;
    displayName: string;
    country: string;
    websiteUrl: string;
}

export const KNOWN_RETAILERS: Record<string, RetailerInfo> = {
    SPAR: {
        code: 'SPAR',
        displayName: 'SPAR Österreich',
        country: 'AT',
        websiteUrl: 'https://www.spar.at',
    },
    BILLA: {
        code: 'BILLA',
        displayName: 'BILLA',
        country: 'AT',
        websiteUrl: 'https://shop.billa.at',
    },
    HOFER: {
        code: 'HOFER',
        displayName: 'HOFER',
        country: 'AT',
        websiteUrl: 'https://www.hofer.at',
    },
    LIDL: {
        code: 'LIDL',
        displayName: 'Lidl Österreich',
        country: 'AT',
        websiteUrl: 'https://www.lidl.at',
    },
};

export async function getRetailerId(retailerCode: string = 'SPAR'): Promise<string> {
    const upper = retailerCode.toUpperCase();
    const info = KNOWN_RETAILERS[upper] ?? {
        code: upper,
        displayName: retailerCode,
        country: 'AT',
        websiteUrl: '',
    };

    const client = await pg.connect();
    try {
        const res = await client.query(
            `
            INSERT INTO retailer (code, display_name, country, website_url)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (code)
            DO UPDATE SET
                display_name = EXCLUDED.display_name,
                country = EXCLUDED.country,
                website_url = EXCLUDED.website_url
            RETURNING id
            `,
            [info.code, info.displayName, info.country, info.websiteUrl]
        );
        return res.rows[0].id;
    } finally {
        client.release();
    }
}
