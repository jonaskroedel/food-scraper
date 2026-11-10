import { buildSparUrl, SPAR_CATEGORIES } from './spar.config';
import { fetchJson } from '../../utils/http';
import { sleep } from '../../utils/sleep';
import { logger } from '../../utils/logger';

export interface SparStreamOptions {
    maxPages?: number;
    startPage?: number;
    categories?: string[];
    delayMs?: number;
}

export async function* streamSparProducts(options: SparStreamOptions | number = 0) {
    const opts: SparStreamOptions = typeof options === 'number' ? { maxPages: options } : options;
    const limitPages = opts.maxPages && opts.maxPages > 0 ? opts.maxPages : Infinity;
    const startPage = opts.startPage && opts.startPage > 0 ? opts.startPage : 1;
    const categories = opts.categories ?? ['lebensmittel'];
    const delayMs = opts.delayMs ?? 350;

    for (const category of categories) {
        let page = startPage;
        let fetchedPages = 0;
        let hasMore = true;

        while (hasMore && fetchedPages < limitPages) {
            const url = buildSparUrl(page, category);

            try {
                const data = await fetchJson<any>(url, {
                    headers: {
                        Accept: 'application/json',
                    },
                });

                const hits = data?.hits ?? [];
                if (!hits.length) {
                    hasMore = false;
                    break;
                }

                for (const hit of hits) {
                    yield hit;
                }

                page++;
                fetchedPages++;
                await sleep(delayMs);
            } catch (err: any) {
                logger.warn(`SPAR fetch error for category ${category} page ${page}: ${err.message}`);
                break;
            }
        }
    }
}
