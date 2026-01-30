import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { PRODUCTS_PAGE } from './queries'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)

    const cursor = searchParams.get('cursor')
    const limit = Math.min(
        Number(searchParams.get('limit') ?? 30),
        100
    )

    try {
        const { rows } = await pool.query(PRODUCTS_PAGE, [
            cursor,
            limit,
        ])

        return NextResponse.json({
            items: rows,
            nextCursor: rows.at(-1)?.id ?? null,
        })
    } catch (err) {
        console.error('API /api/products failed:', err)

        return NextResponse.json(
            { error: 'internal_error' },
            { status: 500 }
        )
    }
}
