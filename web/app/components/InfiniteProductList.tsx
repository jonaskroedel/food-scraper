'use client'

import { useEffect, useRef, useState } from 'react'
import { ProductCard } from './ProductCard'
import { Product } from '@types/product'

export function InfiniteProductList() {
    const [items, setItems] = useState<Product[]>([])
    const [cursor, setCursor] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const sentinelRef = useRef<HTMLDivElement | null>(null)

    async function loadMore() {
        if (loading || !hasMore) return
        setLoading(true)

        try {
            const params = new URLSearchParams(cursor ? { cursor } : {})
            const res = await fetch(`/api/products?${params}`)
            const data = await res.json()

            setItems(prev => {
                const existingIds = new Set(prev.map(p => p.id))
                const newItems = data.items.filter((p: Product) => !existingIds.has(p.id))
                return [...prev, ...newItems]
            })

            setCursor(data.nextCursor)
            setHasMore(!!data.nextCursor)
        } catch (error) {
            console.error("Fehler beim Laden:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) loadMore()
            },
            { rootMargin: '400px' }
        )

        if (sentinelRef.current) observer.observe(sentinelRef.current)
        return () => observer.disconnect()
    }, [cursor, hasMore, loading])

    return (
        <>
            {items.map(p => <ProductCard key={p.id} product={p} />)}

            <div ref={sentinelRef} className="w-full h-10 col-span-full" />

            {loading && (
                <div className="col-span-full flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                </div>
            )}
        </>
    )
}