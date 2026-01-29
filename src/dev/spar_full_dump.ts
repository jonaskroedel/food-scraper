import { chromium } from 'playwright';
import fs from 'fs';

const API_BASE =
    'https://api-scp.spar-ics.com/ecom/pw/v1/search/v1/navigation';

const COMMON_PARAMS =
    '?query=*' +
    '&sort=Relevancy:asc' +
    '&marketId=NATIONAL' +
    '&showPermutedSearchParams=false' +
    '&filter=pwCategoryPathIDs:lebensmittel' +
    '&hitsPerPage=32';

async function run() {
    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
        locale: 'de-DE',
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/143.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    console.log('▶ Establishing SPAR session…');
    await page.goto('https://www.spar.at/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
    });

    await page.waitForTimeout(1500); // Cookie / Bot-Manager settle

    const allProducts: any[] = [];

    for (let pageNr = 1; pageNr <= 3; pageNr++) {
        console.log(`▶ Fetching page ${pageNr}…`);

        const url = `${API_BASE}${COMMON_PARAMS}&page=${pageNr}`;

        const result = await page.evaluate(async (u) => {
            const res = await fetch(u, {
                credentials: 'include',
                headers: {
                    accept: 'application/json',
                },
            });

            return {
                status: res.status,
                json: await res.json(),
            };
        }, url);

        if (result.status !== 200) {
            throw new Error(`API failed on page ${pageNr}`);
        }

        const hits = result.json.hits ?? [];
        console.log(`  → ${hits.length} products`);

        for (const h of hits) {
            const geo = h.masterValues?.geoInformation?.[0]?.geoValues;

            allProducts.push({
                chain: 'SPAR',

                externalId: h.masterValues.productId,
                slug: h.masterValues.slug,
                productUrl: `https://www.spar.at/p/${h.masterValues.slug}`,

                brand: h.masterValues.name1 ?? null,
                name: h.masterValues.name2,
                sizeText: h.masterValues.name3 ?? null,

                price: geo?.calculatedPrice ?? null,
                currency: h.masterValues.regularPriceCurrency ?? null,

                basePrice: geo?.comparisonPrice_price ?? null,
                baseUnit: geo?.comparisonPrice_unit ?? null,

                badges: h.masterValues.badgeAltTexts_plp ?? [],

                categoryIds: h.pwCategoryPathIDs ?? [],

                imageUrl: h.masterValues.productImage_assetUrl
                    ? h.masterValues.productImage_assetUrl
                        .replace('{size}', '500')
                        .replace('{ext}', 'jpg')
                    : null,

                fetchedAt: new Date().toISOString(),
                page: pageNr,

                // optional, aber fürs Debuggen extrem wertvoll
                rawPayload: {
                    fetchedFrom: 'spar_navigation_api',
                    fetchedPage: pageNr,
                    fetchedAt: new Date().toISOString(),
                    data: structuredClone(h),
                },

            });
        }

    }

    await browser.close();

    console.log(`\n✅ Total products collected: ${allProducts.length}`);

    // 🔴 Vollständiger Rohdump
    fs.writeFileSync(
        'spar_raw_dump.json',
        JSON.stringify(allProducts, null, 2),
        'utf-8'
    );

    console.log('💾 Written spar_raw_dump.json');

    // Kurzer Sicht-Check in der Konsole
    for (const p of allProducts.slice(0, 3)) {
        console.log('---');
        console.log(
            p.brand,
            p.name,
            '|',
            p.sizeText,
            '|',
            p.price,
            p.currency
        );

        if (p.rawPayload?.masterValues) {
            console.log(
                'masterValues keys:',
                Object.keys(p.rawPayload.masterValues)
            );
        }
    }

}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
