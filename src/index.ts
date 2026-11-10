import { checkDb } from './db/health';
import { ensureSchema } from './db/ensureSchema';
import { SCRAPERS, runAllScrapers } from './scrapers/index';
import type { RetailerCode, ScraperOptions } from './scrapers/scraperTypes';
import { ENV } from './env';
import { logger } from './utils/logger';

function parseArgs() {
    const args = process.argv.slice(2);
    let retailer: string | null = null;
    let maxPages: number | undefined = undefined;
    let startPage: number | undefined = undefined;
    let isAll = false;
    let forceDump = false;
    let forceDb = false;

    for (const arg of args) {
        if (arg === '--all' || arg === '-a') {
            isAll = true;
        } else if (arg.startsWith('--retailer=')) {
            retailer = arg.split('=')[1].toUpperCase();
        } else if (arg.startsWith('-r=')) {
            retailer = arg.split('=')[1].toUpperCase();
        } else if (arg.startsWith('--pages=')) {
            maxPages = parseInt(arg.split('=')[1], 10);
        } else if (arg.startsWith('--startPage=') || arg.startsWith('--start=')) {
            startPage = parseInt(arg.split('=')[1], 10);
        } else if (arg === '--dump' || arg === '-d') {
            forceDump = true;
        } else if (arg === '--db') {
            forceDb = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Austrian Supermarket Food Scraper (SPAR, BILLA, HOFER, LIDL)

Usage:
  npm run dev:scraper                     Run BILLA scraper
  npm run dev:scraper:all                 Run all scrapers sequentially
  npm run dev:scraper:billa               Run BILLA scraper
  npm run dev:scraper:hofer               Run HOFER scraper
  npm run dev:scraper:lidl                Run LIDL scraper
  npm run dev:scraper:spar                Run SPAR scraper

Options:
  --retailer=<code|all>   Target retailer (SPAR, BILLA, HOFER, LIDL, ALL)
  --pages=<n>             Limit pages/categories to scrape (e.g. --pages=10)
  --startPage=<n>         Start scraping from specific page number (e.g. --startPage=64)
  --dump, -d              Save scraped items directly to JSON dump files (no DB needed)
  --db                    Force database mode (fails if DB is unreachable)
  --help, -h              Show this help
            `);
            process.exit(0);
        }
    }

    return { retailer, maxPages, startPage, isAll, forceDump, forceDb };
}

async function main() {
    const { retailer, maxPages, startPage, isAll, forceDump, forceDb } = parseArgs();

    logger.info('🚀 Food Scraper started');

    let dumpToFile = forceDump;

    if (!forceDump) {
        logger.info(`Checking database connection (${ENV.db.host}:${ENV.db.port})...`);
        const dbOk = await checkDb(1500);

        if (dbOk) {
            logger.success('🗄️ Database connected successfully');
            try {
                await ensureSchema();
            } catch (err: any) {
                logger.warn(`Schema verification warning: ${err.message}`);
            }
        } else {
            if (forceDb) {
                logger.error(`Fatal: Database at ${ENV.db.host}:${ENV.db.port} is not reachable and --db was specified.`);
                process.exit(1);
            }

            logger.warn(`⚠️ Database at ${ENV.db.host}:${ENV.db.port} is not reachable.`);
            logger.info('💡 Automatic fallback to DUMP MODE: Scraped products will be saved to JSON dump files!');
            dumpToFile = true;
        }
    }

    const options: ScraperOptions = {
        maxPages: maxPages ?? 0, // 0 = full catalog without limit
        startPage,
        dumpToFile,
    };

    if (isAll || retailer === 'ALL') {
        await runAllScrapers(options);
    } else if (retailer && retailer in SCRAPERS) {
        const scraper = SCRAPERS[retailer as RetailerCode];
        logger.info(`Starting single scraper: ${scraper.displayName}`);
        await scraper.run(options);
    } else {
        // Default to BILLA or SPAR
        logger.info('No retailer specified, running BILLA scraper (use --all or --retailer=SPAR|HOFER|LIDL to choose)');
        await SCRAPERS.BILLA.run(options);
    }

    logger.success('\n✅ Scraper run finished.');
    if (dumpToFile) {
        logger.info('🎉 Data was saved to JSON dumps! Start the web app with `npm run dev:web` to see your new data in the browser.');
    }
    process.exit(0);
}

main().catch(err => {
    logger.error('Fatal scraper error:', err);
    process.exit(1);
});
