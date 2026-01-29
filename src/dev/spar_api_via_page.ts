import { chromium } from 'playwright';

const API_URL =
    'https://api-scp.spar-ics.com/ecom/pw/v1/search/v1/navigation' +
    '?query=*' +
    '&sort=Relevancy:asc' +
    '&page=1' +
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

    console.log('▶ Opening spar.at (no networkidle!)');

    // 🔴 WICHTIG: NICHT networkidle
    await page.goto('https://www.spar.at/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
    });

    // kurzer, definierter Delay → Cookies + Bot-Manager setzen
    await page.waitForTimeout(1500);

    console.log('▶ Fetching API inside page context…');

    const result = await page.evaluate(async (url) => {
        const res = await fetch(url, {
            credentials: 'include',
            headers: {
                accept: 'application/json',
            },
        });

        return {
            status: res.status,
            text: await res.text(),
        };
    }, API_URL);

    console.log('Status:', result.status);

    if (result.status !== 200) {
        console.log('Response preview:');
        console.log(result.text.slice(0, 200));
        throw new Error('API fetch failed');
    }

    const json = JSON.parse(result.text);

    console.log('Hits:', json.hits.length);
    for (const h of json.hits.slice(0, 3)) {
        const v = h.masterValues;
        console.log('-', v.name1, v.name2, '|', v.name3);
    }

    await browser.close();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
