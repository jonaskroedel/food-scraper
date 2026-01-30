import { chromium } from 'playwright';
import { SPAR_BASE_URL, COMMON_PARAMS } from './spar.config.js';
import { sleep } from '../../utils/sleep.js';

export async function* streamSparProductsParallel() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('🔑 Initialisiere SPAR Browser-Session...');
    await page.goto('https://www.spar.at/produktauswahl', { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    let pageNr = 1;
    let hasMore = true;
    const CHUNK_SIZE = 6;

    while (hasMore) {
        console.log(`🌐 Lade Batch ab Seite ${pageNr}...`);

        const urls = Array.from({ length: CHUNK_SIZE }).map((_, i) =>
            `${SPAR_BASE_URL}${COMMON_PARAMS}&page=${pageNr + i}`
        );

        // Wir nutzen new Function(), um sicherzustellen, dass tsx den Code nicht transformiert
        const results = await page.evaluate(async (targetUrls) => {
            const fetcher = new Function('url', `
                return fetch(url).then(r => {
                    if (!r.ok) return null;
                    return r.json();
                }).catch(() => null);
            `);

            return await Promise.all(targetUrls.map(u => fetcher(u)));
        }, urls);

        let foundInChunk = 0;
        for (const data of results) {
            const hits = (data as any)?.hits ?? [];
            if (hits.length > 0) {
                foundInChunk += hits.length;
                for (const hit of hits) yield hit;
            }
        }

        if (foundInChunk === 0) {
            console.log('🏁 Keine weiteren Produkte gefunden.');
            hasMore = false;
        } else {
            pageNr += CHUNK_SIZE;
            await sleep(500);
        }
    }

    await browser.close();
}