import { LIDL_BASE_URL, LIDL_FOOD_CATEGORY_ID, LIDL_PAGE_SIZE } from './lidl.config';
import { fetchJson } from '../../utils/http';
import { sleep } from '../../utils/sleep';
import { logger } from '../../utils/logger';

export async function* streamLidlProducts(maxItems: number = 0, allCategories: boolean = false) {
    let offset = 0;
    let fetched = 0;
    let hasMore = true;
    const limitItems = maxItems > 0 ? maxItems : Infinity;

    while (hasMore && fetched < limitItems) {
        let url =
            `${LIDL_BASE_URL}` +
            `?fetchsize=${LIDL_PAGE_SIZE}` +
            `&offset=${offset}` +
            `&assortment=AT` +
            `&locale=de_AT` +
            `&version=2.1.0`;

        if (!allCategories && LIDL_FOOD_CATEGORY_ID) {
            url += `&category.id=${LIDL_FOOD_CATEGORY_ID}`;
        }

        try {
            const headers = {
                Accept: 'application/mindshift.search+json;version=2',
                'Accept-Language': 'de-AT,de;q=0.9',
            };

            const json = await fetchJson<any>(url, { headers });
            const items = json.items ?? [];

            if (items.length === 0) {
                hasMore = false;
                break;
            }

            for (const item of items) {
                yield item;
                fetched++;
                if (fetched >= limitItems) break;
            }

            offset += LIDL_PAGE_SIZE;
            await sleep(200);
        } catch (err: any) {
            logger.warn(`LIDL fetch failed at offset ${offset}: ${err.message}`);
            break;
        }
    }
}
