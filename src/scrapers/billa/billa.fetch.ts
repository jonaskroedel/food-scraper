import { BILLA_API_BASE, BILLA_PAGE_SIZE } from './billa.config';
import { fetchJson } from '../../utils/http';
import { sleep } from '../../utils/sleep';
import { logger } from '../../utils/logger';

export async function* streamBillaProducts(maxPages: number = 0) {
    let page = 0;
    let hasMore = true;
    const limitPages = maxPages > 0 ? maxPages : Infinity;

    while (hasMore && page < limitPages) {
        const url = `${BILLA_API_BASE}?pageSize=${BILLA_PAGE_SIZE}&sortBy=relevance&enableStatistics=false&enablePersonalization=false&page=${page}`;

        try {
            const data = await fetchJson<any>(url);
            const results = data.results ?? [];

            if (results.length === 0) {
                hasMore = false;
                break;
            }

            for (const item of results) {
                yield item;
            }

            page++;
            await sleep(200);
        } catch (err: any) {
            logger.warn(`BILLA fetch failed on page ${page}: ${err.message}`);
            break;
        }
    }
}
