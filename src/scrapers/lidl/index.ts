import fs from 'node:fs';
import path from 'node:path';
import { streamLidlProducts } from './lidl.fetch';
import { normalizeLidlHit } from './lidl.normalize';
import { bulkUpsertProducts } from '../../db/persist';
import { ensureSchema } from '../../db/ensureSchema';
import { getRetailerId } from '../../db/getRetailerId';
import { pg } from '../../db/pg';
import { logger } from '../../utils/logger';
import type { RetailerScraper, ScraperOptions, ScraperResult, NormalizedProduct } from '../scraperTypes';

export async function runLidlScraper(options: ScraperOptions = {}): Promise<ScraperResult> {
    const startTime = Date.now();
    const maxItems = options.maxPages ? options.maxPages * 36 : 0;
    const batchSize = options.batchSize ?? 100;
    const dumpToFile = options.dumpToFile ?? false;

    logger.info(`🚀 Starting LIDL scraper (maxItems=${maxItems === 0 ? 'ALL (complete food catalog)' : maxItems}, mode=${dumpToFile ? 'DUMP FILE' : 'DATABASE'})...`);

    let processed = 0;
    let upserted = 0;
    let errors = 0;
    const allItems: NormalizedProduct[] = [];

    if (dumpToFile) {
        for await (const raw of streamLidlProducts(maxItems)) {
            try {
                const norm = normalizeLidlHit(raw);
                allItems.push(norm);
                processed++;
                process.stdout.write(`\r📦 LIDL fetched: ${processed} items...`);
            } catch (err: any) {
                errors++;
                logger.warn(`Error normalizing LIDL item: ${err.message}`);
            }
        }

        const outputPath = options.outputFile ?? path.resolve('lidl_raw_dump_food.json');
        if (allItems.length > 0) {
            fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2), 'utf-8');
            logger.success(`\n💾 Saved ${allItems.length} LIDL items to ${outputPath}`);
        } else {
            logger.warn('\n⚠️ LIDL: Keine neuen Artikel geladen. Bestehender Dump bleibt erhalten.');
        }

        return {
            retailer: 'LIDL',
            totalFetched: processed,
            totalUpserted: 0,
            durationMs: Date.now() - startTime,
            errors,
            dumpFilePath: outputPath,
        };
    }

    // Database mode
    await ensureSchema();
    const retailerId = await getRetailerId('LIDL');
    let batch: NormalizedProduct[] = [];
    const client = await pg.connect();

    try {
        for await (const raw of streamLidlProducts(maxItems)) {
            try {
                batch.push(normalizeLidlHit(raw));
                processed++;

                if (batch.length >= batchSize) {
                    const count = await bulkUpsertProducts(batch, retailerId, client);
                    upserted += count;
                    process.stdout.write(`\r📦 LIDL processed: ${processed} items...`);
                    batch = [];
                }
            } catch (err: any) {
                errors++;
                logger.warn(`Error normalizing LIDL item: ${err.message}`);
            }
        }

        if (batch.length > 0) {
            const count = await bulkUpsertProducts(batch, retailerId, client);
            upserted += count;
        }

        logger.success(
            `\nLIDL scraping finished: ${processed} products fetched, ${upserted} upserted in ${(
                (Date.now() - startTime) /
                1000
            ).toFixed(1)}s.`
        );
    } catch (e: any) {
        logger.error('LIDL scraper fatal error:', e);
        errors++;
    } finally {
        client.release();
    }

    return {
        retailer: 'LIDL',
        totalFetched: processed,
        totalUpserted: upserted,
        durationMs: Date.now() - startTime,
        errors,
    };
}

export const lidlScraper: RetailerScraper = {
    retailerCode: 'LIDL',
    displayName: 'Lidl Österreich',
    run: runLidlScraper,
};
