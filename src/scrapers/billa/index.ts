import fs from 'node:fs';
import path from 'node:path';
import { streamBillaProducts } from './billa.fetch';
import { normalizeBillaHit } from './billa.normalize';
import { bulkUpsertProducts } from '../../db/persist';
import { ensureSchema } from '../../db/ensureSchema';
import { getRetailerId } from '../../db/getRetailerId';
import { pg } from '../../db/pg';
import { logger } from '../../utils/logger';
import type { RetailerScraper, ScraperOptions, ScraperResult, NormalizedProduct } from '../scraperTypes';

export async function runBillaScraper(options: ScraperOptions = {}): Promise<ScraperResult> {
    const startTime = Date.now();
    const maxPages = options.maxPages !== undefined ? options.maxPages : 0;
    const batchSize = options.batchSize ?? 250;
    const dumpToFile = options.dumpToFile ?? false;

    logger.info(`🚀 Starting BILLA scraper (maxPages=${maxPages === 0 ? 'ALL (complete catalog)' : maxPages}, mode=${dumpToFile ? 'DUMP FILE' : 'DATABASE'})...`);

    let processed = 0;
    let upserted = 0;
    let errors = 0;
    const allItems: NormalizedProduct[] = [];

    if (dumpToFile) {
        for await (const raw of streamBillaProducts(maxPages)) {
            try {
                const norm = normalizeBillaHit(raw);
                allItems.push(norm);
                processed++;
                process.stdout.write(`\r📦 BILLA fetched: ${processed} items...`);
            } catch (err: any) {
                errors++;
                logger.warn(`Error normalizing BILLA item: ${err.message}`);
            }
        }

        const outputPath = options.outputFile ?? path.resolve('billa_raw_dump.json');
        if (allItems.length > 0) {
            fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2), 'utf-8');
            logger.success(`\n💾 Saved ${allItems.length} BILLA items to ${outputPath}`);
        } else {
            logger.warn('\n⚠️ BILLA: Keine neuen Artikel geladen. Bestehender Dump bleibt erhalten.');
        }

        return {
            retailer: 'BILLA',
            totalFetched: processed,
            totalUpserted: 0,
            durationMs: Date.now() - startTime,
            errors,
            dumpFilePath: outputPath,
        };
    }

    // Database mode
    await ensureSchema();
    const retailerId = await getRetailerId('BILLA');
    let batch: NormalizedProduct[] = [];
    const client = await pg.connect();

    try {
        for await (const raw of streamBillaProducts(maxPages)) {
            try {
                batch.push(normalizeBillaHit(raw));
                processed++;

                if (batch.length >= batchSize) {
                    const count = await bulkUpsertProducts(batch, retailerId, client);
                    upserted += count;
                    process.stdout.write(`\r📦 BILLA processed: ${processed} items...`);
                    batch = [];
                }
            } catch (err: any) {
                errors++;
                logger.warn(`Error normalizing BILLA item: ${err.message}`);
            }
        }

        if (batch.length > 0) {
            const count = await bulkUpsertProducts(batch, retailerId, client);
            upserted += count;
        }

        logger.success(
            `\nBILLA scraping finished: ${processed} products fetched, ${upserted} upserted in ${(
                (Date.now() - startTime) /
                1000
            ).toFixed(1)}s.`
        );
    } catch (e: any) {
        logger.error('BILLA scraper fatal error:', e);
        errors++;
    } finally {
        client.release();
    }

    return {
        retailer: 'BILLA',
        totalFetched: processed,
        totalUpserted: upserted,
        durationMs: Date.now() - startTime,
        errors,
    };
}

export const billaScraper: RetailerScraper = {
    retailerCode: 'BILLA',
    displayName: 'BILLA',
    run: runBillaScraper,
};
