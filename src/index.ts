import { checkDb } from './db/health.js';
import { runSparScraper } from './scrapers/spar/index.js';

async function main() {
    console.log('🚀 Starting scraper');

    await checkDb();
    console.log('🗄️ DB connected');

    await runSparScraper();

    console.log('✅ Done');
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Fatal error');
    console.error(err);
    process.exit(1);
});