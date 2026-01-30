export async function fetchProducts(cursor?: string) {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)

    const res = await fetch(
        `/api/products?${params.toString()}`,
        { cache: 'no-store' }
    )

    if (!res.ok) throw new Error('API error')
    return res.json()
}
