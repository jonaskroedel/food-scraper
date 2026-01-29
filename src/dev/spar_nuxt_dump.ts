import { chromium } from 'playwright';
import fs from 'fs';
import { load } from 'cheerio';

const TARGET_URL = 'https://www.spar.at/produktwelt/lebensmittel?page=1';
const HTML_FILE = 'spar_lebensmittel_page1.html';

async function run() {
    console.log('▶ Opening browser…');

    const browser = await chromium.launch({
        headless: true, // auf false setzen, wenn du zusehen willst
    });

    const context = await browser.newContext({
        locale: 'de-DE',
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/122.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    console.log('▶ Loading spar.at page…');
    await page.goto(TARGET_URL, {
        waitUntil: 'networkidle',
        timeout: 60000,
    });

    const html = await page.content();

    console.log('▶ Saving HTML to file…');
    fs.writeFileSync(HTML_FILE, html, 'utf-8');

    await browser.close();

    console.log('▶ HTML saved as:', HTML_FILE);

    console.log('▶ Extracting Nuxt JSON…');
    extractAndDumpNuxtState(html);
}

function extractAndDumpNuxtState(html: string) {
    const $ = load(html);

    const script = $('script[type="application/json"][data-nuxt-data]')
        .first()
        .text();

    if (!script) {
        throw new Error('❌ Nuxt JSON not found in HTML');
    }

    const nuxtState = JSON.parse(script);

    console.log('✅ Nuxt state parsed');
    console.log('--- TOP LEVEL STRUCTURE ---');

    // nicht alles auf einmal – sonst stirbt die Konsole
    console.dir(nuxtState, { depth: 4, maxArrayLength: 20 });

    console.log('\n▶ Hint: Search inside nuxtState for:');
    console.log('- products');
    console.log('- items');
    console.log('- price');
    console.log('- name');
    console.log('- badges');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
