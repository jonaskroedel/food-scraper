import { streamSparProducts } from './spar.fetch.js';
import { normalizeSparHit } from './spar.normalize.js';
import { upsertSparProduct } from './spar.persist.js';
import { ensureSchema } from '../../db/ensureSchema.js';
import { getRetailerId } from '../../db/getRetailerId.js';
import readline from 'node:readline';
import { pg } from '../../db/pg.js';

function renderStatus(
    processed: number,
    inserted: number,
    updated: number,
    skipped: number,
    failed: number
) {
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
        `processed: ${processed} | inserted: ${inserted} | updated: ${updated} | skipped: ${skipped} | failed: ${failed}`
    );
}

const BATCH_SIZE = 50;

export async function runSparScraper() {
    console.log('▶ SPAR: streaming import');
    await ensureSchema();

    const retailerId = await getRetailerId();
    console.log(`🧾 Retailer ready (${retailerId})`);

    let processed = 0;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const client = await pg.connect();
    let batchCount = 0;

    try {
        await client.query('BEGIN');

        for await (const hit of streamSparProducts()) {
            processed++;
            batchCount++;

            try {
                const normalized = normalizeSparHit(hit);
                const result = await upsertSparProduct(
                    normalized,
                    retailerId,
                    client // wir nutzen dieselbe Verbindung
                );

                switch (result.status) {
                    case 'inserted':
                        inserted++;
                        break;

                    case 'updated':
                        updated++;

                        console.log(
                            `\n🔄 UPDATED productId=${normalized.externalId}`
                        );

                        for (const d of result.diff) {
                            console.log(
                                `   • ${d.field}: ${d.before} → ${d.after}`
                            );
                        }

                        break;

                    case 'skipped':
                        skipped++;
                        break;
                }
            } catch (e: any) {
                failed++;
                console.error(
                    `\n❌ FAIL productId=${hit?.masterValues?.productId}`,
                    {
                        message: e?.message,
                        code: e?.code,
                        detail: e?.detail,
                    }
                );
            }

            if (batchCount >= BATCH_SIZE) {
                await client.query('COMMIT');
                await client.query('BEGIN');
                batchCount = 0;
            }

            renderStatus(processed, inserted, updated, skipped, failed);
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

    process.stdout.write('\n');
    console.log(
        `✅ SPAR import done | processed: ${processed}, inserted: ${inserted}, updated: ${updated}, skipped: ${skipped}, failed: ${failed}`
    );
}