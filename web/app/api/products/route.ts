import { NextResponse } from 'next/server';
import { db as pool } from '@db';
import { buildProductsQuery } from './queries';
import { queryFallbackProducts } from '../../../lib/dumpFallback';
import { isDbAvailable, recordDbFailure, recordDbSuccess } from '../../../../src/db/health';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get('cursor');
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const limit = Math.min(Number(searchParams.get('limit') ?? 30), 100);
    const q = searchParams.get('q');
    const retailer = searchParams.get('retailer');
    const bio = searchParams.get('bio') === 'true';
    const sort = searchParams.get('sort') as any;

    // Fast-path: If DB is known to be offline or unreachable, serve from local snapshot instantly
    if (!isDbAvailable()) {
        const fallbackResult = queryFallbackProducts({
            q,
            retailer,
            bio,
            sort,
            limit,
            offset,
        });

        return NextResponse.json({
            items: fallbackResult.items,
            nextOffset: fallbackResult.nextOffset,
            total: fallbackResult.total,
            isFallback: true,
        });
    }

    try {
        const { sql, values } = buildProductsQuery({
            cursor,
            limit,
            search: q,
            retailer,
            onlyBio: bio,
            sortBy: sort,
        });

        const { rows } = await pool.query(sql, values);
        recordDbSuccess();

        return NextResponse.json({
            items: rows,
            nextCursor: rows.at(-1)?.id ?? null,
            isFallback: false,
        });
    } catch (err: any) {
        // Record failure so next requests during cooldown don't wait on connection timeout
        recordDbFailure(err.message);
        console.warn('⚠️ Database query failed, falling back to local dataset:', err.message);

        const fallbackResult = queryFallbackProducts({
            q,
            retailer,
            bio,
            sort,
            limit,
            offset,
        });

        return NextResponse.json({
            items: fallbackResult.items,
            nextOffset: fallbackResult.nextOffset,
            total: fallbackResult.total,
            isFallback: true,
        });
    }
}
