import type { PoolClient } from 'pg';
import type { NormalizedProduct } from '../scraperTypes';
import { bulkUpsertProducts } from '../../db/persist';

export async function bulkUpsertSparProducts(
    products: NormalizedProduct[],
    retailerId: string,
    client: PoolClient
): Promise<number> {
    return bulkUpsertProducts(products, retailerId, client);
}
