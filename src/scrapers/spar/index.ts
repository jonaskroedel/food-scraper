import fs from 'node:fs';
import path from 'node:path';
import { streamSparProducts } from './spar.fetch';
import { normalizeSparHit } from './spar.normalize';
import { bulkUpsertProducts } from '../../db/persist';
import { ensureSchema } from '../../db/ensureSchema';
import { getRetailerId } from '../../db/getRetailerId';
import { pg } from '../../db/pg';
import { logger } from '../../utils/logger';
import type { RetailerScraper, ScraperOptions, ScraperResult, NormalizedProduct } from '../scraperTypes';

export async function runSparScraper(options: ScraperOptions = {}): Promise<ScraperResult> {
    const startTime = Date.now();
    const maxPages = options.maxPages !== undefined ? options.maxPages : 0;
    const batchSize = options.batchSize ?? 250;
    const dumpToFile = options.dumpToFile ?? false;

    const startPage = options.startPage ?? 1;

    logger.info(`🚀 Starting SPAR scraper (startPage=${startPage}, maxPages=${maxPages === 0 ? 'ALL (complete catalog)' : maxPages}, mode=${dumpToFile ? 'DUMP FILE' : 'DATABASE'})...`);

    let processed = 0;
    let upserted = 0;
    let errors = 0;
    const allItems: NormalizedProduct[] = [];

    const streamOptions = {
        maxPages,
        startPage,
        categories: options.categories,
    };

    if (dumpToFile) {
        for await (const hit of streamSparProducts(streamOptions)) {
            try {
                const norm = normalizeSparHit(hit);
                allItems.push(norm);
                processed++;
                process.stdout.write(`\r📦 SPAR fetched: ${processed} items...`);
            } catch (err: any) {
                errors++;
                logger.warn(`Error normalizing SPAR hit: ${err.message}`);
            }
        }

        const outputPath = options.outputFile ?? path.resolve('spar_raw_dump.json');
        if (allItems.length > 0) {
            fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2), 'utf-8');
            logger.success(`\n💾 Saved ${allItems.length} SPAR items to ${outputPath}`);
        } else {
            logger.warn('\n⚠️ SPAR: Keine neuen Artikel geladen. Bestehender Dump bleibt erhalten.');
        }

        return {
            retailer: 'SPAR',
            totalFetched: processed,
            totalUpserted: 0,
            durationMs: Date.now() - startTime,
            errors,
            dumpFilePath: outputPath,
        };
    }

    // Database mode
    await ensureSchema();
    const retailerId = await getRetailerId('SPAR');
    let batch: NormalizedProduct[] = [];
    const client = await pg.connect();

    try {
        for await (const hit of streamSparProducts(streamOptions)) {
            try {
                batch.push(normalizeSparHit(hit));
                processed++;

                if (batch.length >= batchSize) {
                    const count = await bulkUpsertProducts(batch, retailerId, client);
                    upserted += count;
                    process.stdout.write(`\r📦 SPAR upserted: ${upserted} items...`);
                    batch = [];
                }
            } catch (err: any) {
                errors++;
                logger.warn(`Error normalizing SPAR hit: ${err.message}`);
            }
        }

        if (batch.length > 0) {
            const count = await bulkUpsertProducts(batch, retailerId, client);
            upserted += count;
        }

        logger.success(
            `\nSPAR scraping finished: ${processed} products fetched, ${upserted} upserted in ${(
                (Date.now() - startTime) /
                1000
            ).toFixed(1)}s.`
        );
    } catch (e: any) {
        logger.error('SPAR scraper fatal error:', e);
        errors++;
    } finally {
        client.release();
    }

    return {
        retailer: 'SPAR',
        totalFetched: processed,
        totalUpserted: upserted,
        durationMs: Date.now() - startTime,
        errors,
    };
}

export const sparScraper: RetailerScraper = {
    retailerCode: 'SPAR',
    displayName: 'SPAR Österreich',
    run: runSparScraper,
};

export const SparScraper = sparScraper;

