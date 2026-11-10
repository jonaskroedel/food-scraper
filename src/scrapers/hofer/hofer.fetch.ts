import { HOFER_API_BASE, HOFER_PAGE_SIZE, HOFER_SERVICE_POINT } from './hofer.config';
import { fetchJson } from '../../utils/http';
import { sleep } from '../../utils/sleep';
import { logger } from '../../utils/logger';

export async function* streamHoferProducts(maxPages: number = 0) {
    let offset = 0;
    let page = 0;
    let hasMore = true;
    const limitPages = maxPages > 0 ? maxPages : Infinity;

    while (hasMore && page < limitPages) {
        const url = `${HOFER_API_BASE}?currency=EUR&serviceType=walk-in&limit=${HOFER_PAGE_SIZE}&offset=${offset}&sort=relevance&servicePoint=${HOFER_SERVICE_POINT}`;

        try {
            const json = await fetchJson<any>(url, {
                headers: {
                    Accept: 'application/json',
                },
            });

            const items = json?.data ?? [];
            if (!items.length) {
                hasMore = false;
                break;
            }

            for (const item of items) {
                yield item;
            }

            offset += HOFER_PAGE_SIZE;
            page++;

            const totalCount = json?.meta?.pagination?.totalCount;
            if (totalCount && offset >= totalCount) {
                hasMore = false;
                break;
            }

            await sleep(150);
        } catch (err: any) {
            logger.warn(`HOFER fetch failed at offset ${offset}: ${err.message}`);
            break;
        }
    }
}
