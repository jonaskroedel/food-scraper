import { fetchSparProducts } from './sparApiFetcher.js';

export async function runSparScraper() {
    const data = await fetchSparProducts(1);

    const hits = data.hits ?? [];

    console.log(`Found ${hits.length} products\n`);

    for (const h of hits.slice(0, 5)) {
        const v = h.masterValues;

        console.log('------------------------');
        console.log('Name:', v.name1, v.name2);
        console.log('Weight:', v.name3);
        console.log('Badges:', v.badgeAltTexts);
        console.log('Slug:', v.slug);
    }
}
