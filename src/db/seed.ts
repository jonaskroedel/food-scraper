import fs from 'node:fs';
import path from 'node:path';
import { pg } from './pg';
import { ensureSchema } from './ensureSchema';
import { getRetailerId } from './getRetailerId';
import { bulkUpsertProducts } from './persist';
import { normalizeSparHit } from '../scrapers/spar/spar.normalize';
import { normalizeBillaHit } from '../scrapers/billa/billa.normalize';
import { normalizeHoferHit } from '../scrapers/hofer/hofer.normalize';
import { normalizeLidlHit } from '../scrapers/lidl/lidl.normalize';
import { logger } from '../utils/logger';

export async function seedFromDumps() {
    logger.info('🌱 Seeding database from existing raw JSON dumps...');
    await ensureSchema();
    const client = await pg.connect();

    try {
        // 1. Seed SPAR
        const sparPath = path.resolve('spar_raw_dump.json');
        if (fs.existsSync(sparPath)) {
            const sparRetailerId = await getRetailerId('SPAR');
            const rawSpar = JSON.parse(fs.readFileSync(sparPath, 'utf-8'));
            const sparItems = rawSpar.map((hit: any) => hit.rawPayload?.data ? normalizeSparHit(hit.rawPayload.data) : hit);
            const count = await bulkUpsertProducts(sparItems, sparRetailerId, client);
            logger.success(`Seeded ${count} SPAR products from ${sparPath}`);
        }

        // 2. Seed BILLA
        const billaPath = path.resolve('billa_raw_dump.json');
        if (fs.existsSync(billaPath)) {
            const billaRetailerId = await getRetailerId('BILLA');
            const rawBilla = JSON.parse(fs.readFileSync(billaPath, 'utf-8'));
            const billaItems = rawBilla.map((hit: any) => hit.chain ? hit : normalizeBillaHit(hit));
            const count = await bulkUpsertProducts(billaItems, billaRetailerId, client);
            logger.success(`Seeded ${count} BILLA products from ${billaPath}`);
        }

        // 3. Seed HOFER
        const hoferPath = path.resolve('hofer_roksh_bio-gemuse_raw_dump.json');
        if (fs.existsSync(hoferPath)) {
            const hoferRetailerId = await getRetailerId('HOFER');
            const rawHofer = JSON.parse(fs.readFileSync(hoferPath, 'utf-8'));
            const hoferItems = rawHofer.map((hit: any) => hit.chain ? hit : normalizeHoferHit(hit));
            const count = await bulkUpsertProducts(hoferItems, hoferRetailerId, client);
            logger.success(`Seeded ${count} HOFER products from ${hoferPath}`);
        }

        // 4. Seed LIDL
        const lidlPath = path.resolve('lidl_raw_dump_food.json');
        if (fs.existsSync(lidlPath)) {
            const lidlRetailerId = await getRetailerId('LIDL');
            const rawLidl = JSON.parse(fs.readFileSync(lidlPath, 'utf-8'));
            const items = rawLidl.items ?? rawLidl;
            const lidlItems = items.map((hit: any) => hit.chain ? hit : normalizeLidlHit(hit));
            const count = await bulkUpsertProducts(lidlItems, lidlRetailerId, client);
            logger.success(`Seeded ${count} LIDL products from ${lidlPath}`);
        }

        logger.success('✅ Database seeding finished successfully!');
    } catch (err) {
        logger.error('Error during seeding:', err);
        throw err;
    } finally {
        client.release();
    }
}

if (process.argv[1]?.endsWith('seed.ts')) {
    seedFromDumps()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
