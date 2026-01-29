import { chromium } from 'playwright';
import { sleep } from '../../utils/sleep.js';
import { SPAR_BASE_URL, COMMON_PARAMS } from './spar.config.js';
import fs from 'fs';

const CHECKPOINT_FILE = 'dumps/.spar_page_checkpoint';

function loadCheckpoint(): number {
    if (!fs.existsSync(CHECKPOINT_FILE)) return 1;
    return Number(fs.readFileSync(CHECKPOINT_FILE, 'utf-8')) || 1;
}

function saveCheckpoint(page: number) {
    fs.writeFileSync(CHECKPOINT_FILE, String(page));
}


export async function* streamSparProducts() {
    const browser = await chromium.launch({ headless: true });

    let context = await browser.newContext({
        locale: 'de-DE',
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/143.0.0.0 Safari/537.36',
    });

    let page = await context.newPage();
    await page.goto('https://www.spar.at/', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    let pageNr = loadCheckpoint();
    console.log(`🔁 Resuming SPAR scrape at page ${pageNr}`);

    while (true) {
        const url = `${SPAR_BASE_URL}${COMMON_PARAMS}&page=${pageNr}`;

        let result;
        try {
            result = await page.evaluate(async (u: string) => {
                const res = await fetch(u, {
                    credentials: 'include',
                    headers: { accept: 'application/json' },
                });
                return { status: res.status, json: await res.json() };
            }, url);
        } catch {
            console.warn(`⚠️ Fetch failed on page ${pageNr}, restarting session…`);

            await page.close();
            await context.close();

            context = await browser.newContext({
                locale: 'de-DE',
                userAgent:
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                    'Chrome/143.0.0.0 Safari/537.36',
            });

            page = await context.newPage();
            await page.goto('https://www.spar.at/', { waitUntil: 'domcontentloaded' });
            await sleep(1500);

            continue; // gleiche Seite erneut
        }

        if (result.status !== 200) {
            console.warn(`⚠️ HTTP ${result.status} on page ${pageNr}, retrying…`);
            await sleep(2000);
            continue;
        }

        const hits = result.json?.hits ?? [];
        if (hits.length === 0) break;

        for (const hit of hits) {
            yield hit;
        }

        saveCheckpoint(pageNr);
        pageNr++;

        await sleep(150);
    }

    await browser.close();
}
