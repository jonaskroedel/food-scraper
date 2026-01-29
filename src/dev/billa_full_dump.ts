import fs from 'fs';

const API_BASE =
    'https://shop.billa.at/api/product-discovery/products';

const PAGE_SIZE = 30;
const PAGES = 3;

async function fetchPage(page: number) {
    const url =
        `${API_BASE}` +
        `?pageSize=${PAGE_SIZE}` +
        `&sortBy=relevance` +
        `&enableStatistics=true` +
        `&enablePersonalization=false` +
        `&page=${page}`;

    const res = await fetch(url, {
        headers: {
            accept: 'application/json',
            'accept-language': 'de-DE,de;q=0.9',
            'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                'Chrome/143.0.0.0 Safari/537.36',
        },
    });

    if (!res.ok) {
        throw new Error(`BILLA API failed on page ${page} (${res.status})`);
    }

    return res.json();
}

async function run() {
    const allProducts: any[] = [];

    for (let page = 0; page < PAGES; page++) {
        console.log(`▶ Fetching BILLA page ${page}…`);

        const json = await fetchPage(page);
        const results = json.results ?? [];

        console.log(`  → ${results.length} products`);

        for (const product of results) {
            allProducts.push({
                fetchedAt: new Date().toISOString(),
                page,
                ...product, // 🔴 FULL RAW
            });
        }
    }

    console.log(`\n✅ Total products collected: ${allProducts.length}`);

    fs.writeFileSync(
        'billa_raw_dump.json',
        JSON.stringify(allProducts, null, 2),
        'utf-8'
    );

    console.log('💾 Written billa_raw_dump.json');

    // Mini-Sanity-Check
    for (const p of allProducts.slice(0, 3)) {
        console.log('---');
        console.log(
            p.name,
            '|',
            p.price?.amount,
            p.price?.baseUnitShort
        );
        console.log('Keys:', Object.keys(p));
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
