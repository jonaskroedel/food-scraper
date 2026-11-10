import { sparScraper, runSparScraper } from './spar/index';
import { billaScraper, runBillaScraper } from './billa/index';
import { hoferScraper, runHoferScraper } from './hofer/index';
import { lidlScraper, runLidlScraper } from './lidl/index';
import type { RetailerScraper, RetailerCode, ScraperOptions, ScraperResult } from './scraperTypes';
import { logger } from '../utils/logger';

export * from './scraperTypes';
export { sparScraper, runSparScraper } from './spar/index';
export { billaScraper, runBillaScraper } from './billa/index';
export { hoferScraper, runHoferScraper } from './hofer/index';
export { lidlScraper, runLidlScraper } from './lidl/index';

export const SCRAPERS: Record<RetailerCode, RetailerScraper> = {
    SPAR: sparScraper,
    BILLA: billaScraper,
    HOFER: hoferScraper,
    LIDL: lidlScraper,
};

export async function runAllScrapers(options: ScraperOptions = {}): Promise<ScraperResult[]> {
    logger.info('🚀 Starting Multi-Supermarket Scraper Suite (SPAR, BILLA, HOFER, LIDL)...');
    const results: ScraperResult[] = [];

    for (const [code, scraper] of Object.entries(SCRAPERS)) {
        try {
            logger.info(`\n========== [${code}] ${scraper.displayName} ==========`);
            const res = await scraper.run(options);
            results.push(res);
        } catch (err: any) {
            logger.error(`Error executing ${code} scraper: ${err.message}`);
        }
    }

    logger.success('\n================ SUMMARY ================');
    for (const r of results) {
        logger.info(
            `${r.retailer.padEnd(8)}: ${r.totalFetched} fetched | ${r.totalUpserted} upserted | ${(r.durationMs / 1000).toFixed(1)}s`
        );
    }

    return results;
}
