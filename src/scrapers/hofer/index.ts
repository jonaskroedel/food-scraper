import fs from 'node:fs';
import path from 'node:path';
import { streamHoferProducts } from './hofer.fetch';
import { normalizeHoferHit } from './hofer.normalize';
import { bulkUpsertProducts } from '../../db/persist';
import { ensureSchema } from '../../db/ensureSchema';
import { getRetailerId } from '../../db/getRetailerId';
import { pg } from '../../db/pg';
import { logger } from '../../utils/logger';
import type { RetailerScraper, ScraperOptions, ScraperResult, NormalizedProduct } from '../scraperTypes';

export async function runHoferScraper(options: ScraperOptions = {}): Promise<ScraperResult> {
    const startTime = Date.now();
    const maxPages = options.maxPages !== undefined ? options.maxPages : 0;
    const batchSize = options.batchSize ?? 100;
    const dumpToFile = options.dumpToFile ?? false;

    logger.info(`🚀 Starting HOFER Commerce scraper (maxPages=${maxPages === 0 ? 'ALL (complete catalog)' : maxPages}, mode=${dumpToFile ? 'DUMP FILE' : 'DATABASE'})...`);

    let processed = 0;
    let upserted = 0;
    let errors = 0;
    const allItems: NormalizedProduct[] = [];

    if (dumpToFile) {
        for await (const raw of streamHoferProducts(maxPages)) {
            try {
                const norm = normalizeHoferHit(raw);
                allItems.push(norm);
                processed++;
                process.stdout.write(`\r📦 HOFER fetched: ${processed} items...`);
            } catch (err: any) {
                errors++;
                logger.warn(`Error normalizing HOFER item: ${err.message}`);
            }
        }

        const outputPath = options.outputFile ?? path.resolve('hofer_raw_dump.json');
        if (allItems.length > 0) {
            fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2), 'utf-8');
            logger.success(`\n💾 Saved ${allItems.length} HOFER items to ${outputPath}`);
            // Also update legacy dump path if present
            const legacyPath = path.resolve('hofer_roksh_bio-gemuse_raw_dump.json');
            fs.writeFileSync(legacyPath, JSON.stringify(allItems, null, 2), 'utf-8');
        } else {
            logger.warn('\n⚠️ HOFER: Keine neuen Artikel geladen. Bestehender Dump bleibt erhalten.');
        }

        return {
            retailer: 'HOFER',
            totalFetched: processed,
            totalUpserted: 0,
            durationMs: Date.now() - startTime,
            errors,
            dumpFilePath: outputPath,
        };
    }

    // Database mode
    await ensureSchema();
    const retailerId = await getRetailerId('HOFER');
    let batch: NormalizedProduct[] = [];
    const client = await pg.connect();

    try {
        for await (const raw of streamHoferProducts(maxPages)) {
            try {
                batch.push(normalizeHoferHit(raw));
                processed++;

                if (batch.length >= batchSize) {
                    const count = await bulkUpsertProducts(batch, retailerId, client);
                    upserted += count;
                    process.stdout.write(`\r📦 HOFER upserted: ${upserted} items...`);
                    batch = [];
                }
            } catch (err: any) {
                errors++;
                logger.warn(`Error normalizing HOFER item: ${err.message}`);
            }
        }

        if (batch.length > 0) {
            const count = await bulkUpsertProducts(batch, retailerId, client);
            upserted += count;
        }

        logger.success(
            `\nHOFER scraping finished: ${processed} products fetched, ${upserted} upserted in ${(
                (Date.now() - startTime) /
                1000
            ).toFixed(1)}s.`
        );
    } catch (e: any) {
        logger.error('HOFER scraper fatal error:', e);
        errors++;
    } finally {
        client.release();
    }

    return {
        retailer: 'HOFER',
        totalFetched: processed,
        totalUpserted: upserted,
        durationMs: Date.now() - startTime,
        errors,
    };
}

export const hoferScraper: RetailerScraper = {
    retailerCode: 'HOFER',
    displayName: 'HOFER Österreich',
    run: runHoferScraper,
};

export const HoferScraper = hoferScraper;
