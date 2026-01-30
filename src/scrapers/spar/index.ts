import { streamSparProductsParallel } from './spar.fetch.js';
import { normalizeSparHit } from './spar.normalize.js';
import { bulkUpsertSparProducts } from './spar.persist.js';
import { ensureSchema } from '../../db/ensureSchema.js';
import { getRetailerId } from '../../db/getRetailerId.js';
import { pg } from '../../db/pg.js';

export async function runSparScraper() {
    console.log('🚀 SPAR Bulk-Scraper gestartet');
    await ensureSchema();
    const retailerId = await getRetailerId();

    let processed = 0;
    let batch: any[] = [];
    const client = await pg.connect();

    try {
        for await (const hit of streamSparProductsParallel()) {
            batch.push(normalizeSparHit(hit));
            processed++;

            if (batch.length >= 500) {
                await bulkUpsertSparProducts(batch, retailerId, client);
                process.stdout.write(`\r📦 Verarbeitet: ${processed} Artikel...`);
                batch = [];
            }
        }

        if (batch.length > 0) {
            await bulkUpsertSparProducts(batch, retailerId, client);
        }

        console.log(`\n✅ SPAR Import abgeschlossen: ${processed} Produkte synchronisiert.`);
    } catch (e) {
        console.error('\n❌ Scraper-Fehler:', e);
    } finally {
        client.release();
    }
}