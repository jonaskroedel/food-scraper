import 'dotenv/config';
import { runSparScraper } from './scrapers/spar/sparScraper.js';

runSparScraper()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
