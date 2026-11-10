import { Product, Offer } from '@custom-types/product';

function getRetailerBadgeClass(retailer?: string) {
    const r = (retailer ?? '').toUpperCase();
    if (r.includes('SPAR')) return 'bg-red-50 text-red-700 border-red-200';
    if (r.includes('BILLA')) return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    if (r.includes('HOFER')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (r.includes('LIDL')) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
}

export function ProductCard({ product }: { product: Product }) {
    // Sort offers by price ascending to highlight best price
    const offers = [...(product.offers || [])].sort((a, b) => a.price - b.price);
    const bestOffer = offers[0];
    const secondOffer = offers[1];
    const savings = secondOffer && bestOffer ? (secondOffer.price - bestOffer.price) : 0;

    const href = bestOffer?.product_url;
    const Wrapper = href ? 'a' : 'div';

    return (
        <Wrapper
            {...(href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="group flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
            {/* Image Section */}
            <div className="relative h-48 w-full bg-slate-50 flex items-center justify-center p-3 border-b border-gray-100">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.global_name}
                        className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-1 text-xs">
                        <span className="text-2xl">🛒</span>
                        <span>Kein Bild verfügbar</span>
                    </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                    {product.badges?.map(badge => (
                        badge.image_url ? (
                            <img
                                key={badge.id}
                                src={badge.image_url}
                                title={badge.name}
                                alt={badge.name}
                                className="h-6 w-6 object-contain bg-white rounded-full shadow-md p-0.5 border border-gray-100"
                            />
                        ) : (
                            <span
                                key={badge.id}
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 shadow-sm"
                            >
                                🌱 {badge.name}
                            </span>
                        )
                    ))}
                </div>

                {/* Savings Pill if multiple offers exist */}
                {savings > 0 && (
                    <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                        -{savings.toFixed(2)}€ günstiger
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1 p-4">
                {/* Brand & Pack Size */}
                <div className="flex justify-between items-baseline gap-2 mb-1">
                    <span className="text-[11px] font-bold tracking-wide uppercase text-emerald-700 truncate">
                        {product.brand_name || 'Handelsmarke'}
                    </span>
                    {bestOffer?.size_text && (
                        <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded">
                            {bestOffer.size_text}
                        </span>
                    )}
                </div>

                {/* Product Name */}
                <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-3 group-hover:text-emerald-700 transition-colors">
                    {product.global_name}
                </h3>

                {/* Price & Retailer Section */}
                <div className="mt-auto pt-2 border-t border-gray-100">
                    {bestOffer ? (
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-gray-900">
                                        {bestOffer.price.toFixed(2)}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-700">
                                        {bestOffer.currency}
                                    </span>
                                </div>
                                {bestOffer.base_price && (
                                    <div className="text-[11px] text-gray-500 font-medium">
                                        ({bestOffer.base_price.toFixed(2)}€ / {bestOffer.base_unit || 'Einheit'})
                                    </div>
                                )}
                            </div>

                            {/* Retailer Tag */}
                            <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${getRetailerBadgeClass(
                                    bestOffer.retailer_name
                                )}`}
                            >
                                {bestOffer.retailer_name}
                            </span>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-400 italic">Kein Angebot</div>
                    )}

                    {/* Comparison with other supermarkets if multiple offers exist */}
                    {offers.length > 1 && (
                        <div className="mt-2.5 pt-2 border-t border-dashed border-gray-200 flex flex-col gap-1 text-[11px] text-gray-600">
                            <span className="font-semibold text-gray-500 text-[10px] uppercase">
                                Weitere Angebote:
                            </span>
                            {offers.slice(1, 3).map((o, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <span className="truncate">{o.retailer_name}:</span>
                                    <span className="font-semibold text-gray-800">
                                        {o.price.toFixed(2)} {o.currency}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Wrapper>
    );
}
