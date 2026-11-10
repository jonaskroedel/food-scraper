'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '@custom-types/product';

interface InfiniteProductListProps {
    searchQuery: string;
    retailerFilter: string;
    onlyBio: boolean;
    sortBy: string;
}

export function InfiniteProductList({
    searchQuery,
    retailerFilter,
    onlyBio,
    sortBy,
}: InfiniteProductListProps) {
    const [items, setItems] = useState<Product[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [offset, setOffset] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Reset pagination and reload when filters change
    const fetchFirstPage = useCallback(async () => {
        setLoading(true);
        setCursor(null);
        setOffset(0);

        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);
            if (retailerFilter && retailerFilter !== 'ALL') params.set('retailer', retailerFilter);
            if (onlyBio) params.set('bio', 'true');
            if (sortBy) params.set('sort', sortBy);
            params.set('limit', '30');
            params.set('offset', '0');

            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();

            setItems(data.items ?? []);
            setCursor(data.nextCursor ?? null);
            setOffset(data.nextOffset ?? (data.items?.length ?? 0));
            setHasMore(data.isFallback ? !!data.nextOffset : !!data.nextCursor);
            setTotalCount(typeof data.total === 'number' ? data.total : null);
            setIsFallbackMode(!!data.isFallback);
        } catch (error) {
            console.error('Fehler beim ersten Laden:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, retailerFilter, onlyBio, sortBy]);

    useEffect(() => {
        fetchFirstPage();
    }, [fetchFirstPage]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);
            if (retailerFilter && retailerFilter !== 'ALL') params.set('retailer', retailerFilter);
            if (onlyBio) params.set('bio', 'true');
            if (sortBy) params.set('sort', sortBy);
            params.set('limit', '30');

            if (cursor) {
                params.set('cursor', cursor);
            }
            if (offset) {
                params.set('offset', String(offset));
            }

            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();
            const newItems: Product[] = data.items ?? [];

            setItems(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const filtered = newItems.filter(p => !existingIds.has(p.id));
                return [...prev, ...filtered];
            });

            setCursor(data.nextCursor ?? null);
            setOffset(data.nextOffset ?? (offset + newItems.length));
            setHasMore(data.isFallback ? !!data.nextOffset : !!data.nextCursor);
        } catch (error) {
            console.error('Fehler beim Nachladen:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, searchQuery, retailerFilter, onlyBio, sortBy, cursor, offset]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !loading && hasMore) {
                    loadMore();
                }
            },
            { rootMargin: '400px' }
        );

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, [loadMore, loading, hasMore]);

    return (
        <div className="w-full">
            {/* Status bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-gray-200 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                        {items.length} {items.length === 1 ? 'Produkt' : 'Produkte'}
                    </span>
                    {totalCount !== null && totalCount > items.length && (
                        <span>von {totalCount} Treffern</span>
                    )}
                </div>

                {isFallbackMode && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Lokaler Snapshot (SPAR, BILLA, HOFER, LIDL)
                    </span>
                )}
            </div>

            {/* Empty state */}
            {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl mb-4">
                        🔍
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Keine Produkte gefunden</h3>
                    <p className="text-gray-500 max-w-md text-sm mb-6">
                        Für deine aktuellen Filterkriterien &quot;{searchQuery}&quot; wurden leider keine Artikel gefunden. Versuche es mit einem allgemeineren Begriff (z. B. &quot;Milch&quot;, &quot;Apfel&quot;, &quot;Bio&quot;).
                    </p>
                </div>
            )}

            {/* Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-stretch">
                {items.map(p => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>

            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} className="w-full h-12" />

            {/* Loading Indicator */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent shadow-sm" />
                    <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
                        Lade Supermarkt-Preise...
                    </span>
                </div>
            )}

            {/* End of results message */}
            {!hasMore && items.length > 0 && !loading && (
                <div className="text-center py-10 text-xs text-gray-400 font-medium">
                    ✨ Alle verfügbaren Angebote wurden geladen ({items.length} Produkte)
                </div>
            )}
        </div>
    );
}
