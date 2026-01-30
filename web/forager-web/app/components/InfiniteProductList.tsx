'use client'

import { useEffect, useRef, useState } from 'react'
import { ProductCard } from './ProductCard'

type ApiResponse = {
    items: any[]
    nextCursor: string | null
}

export function InfiniteProductList() {
    const [items, setItems] = useState<any[]>([])
    const [cursor, setCursor] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const sentinelRef = useRef<HTMLDivElement | null>(null)

    async function loadMore() {
        if (loading || !hasMore) return
        setLoading(true)

        const params = new URLSearchParams()
        if (cursor) params.set('cursor', cursor)

        const res = await fetch(`/api/products?${params.toString()}`)
        if (!res.ok) {
            setLoading(false)
            return
        }

        const data: ApiResponse = await res.json()

        setItems(prev => {
            const seen = new Set(prev.map(p => p.id))
            const merged = [...prev]

            for (const p of data.items) {
                if (!seen.has(p.id)) {
                    merged.push(p)
                    seen.add(p.id)
                }
            }
            return merged
        })

        setCursor(data.nextCursor)
        setHasMore(Boolean(data.nextCursor))
        setLoading(false)
    }

    // Initial load
    useEffect(() => {
        loadMore()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // IntersectionObserver
    useEffect(() => {
        if (!sentinelRef.current) return

        const observer = new IntersectionObserver(
            entries => {
                const first = entries[0]
                if (first.isIntersecting) {
                    loadMore()
                }
            },
            {
                rootMargin: '300px', // lädt kurz bevor man unten ist
            }
        )

        observer.observe(sentinelRef.current)
        return () => observer.disconnect()
    }, [cursor, hasMore, loading])

    return (
        <>
            {items.map(p => (
                <ProductCard key={p.id} product={p} />
            ))}

            {/* Sentinel */}
            <div ref={sentinelRef} className="h-1 col-span-full" />

            {loading && (
                <div className="col-span-full text-center text-gray-500 py-6">
                    Lade Produkte…
                </div>
            )}

            {!hasMore && (
                <div className="col-span-full text-center text-gray-400 py-6">
                    Keine weiteren Produkte
                </div>
            )}
        </>
    )
}
