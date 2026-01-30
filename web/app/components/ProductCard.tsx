import Image from 'next/image'
import { Product } from '@types/product';

const CARD_STYLES = `
  group block h-[380px] bg-white rounded-xl border border-gray-200 
  transition-all duration-300 ease-out 
  hover:border-transparent hover:shadow-2xl hover:-translate-y-1
`

export function ProductCard({ product }: { product: Product }) {
    const offer = product.offers?.[0]
    const href = offer?.product_url
    const Wrapper = href ? 'a' : 'div'

    return (
        <Wrapper
            {...(href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={CARD_STYLES}
        >
            {/* IMAGE SLOT mit Badge-Overlay */}
            <div className="relative h-44 w-full bg-gray-50 border-b rounded-t-xl overflow-hidden flex items-center justify-center">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.global_name}
                        className="h-full w-full object-contain p-3"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        Kein Bild
                    </div>
                )}


            {/* NEU: Badges anzeigen (Bio, etc.)  */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {product.badges?.map(badge => (
                        <img key={badge.id} src={badge.image_url} title={badge.name} className="h-6 w-6 object-contain bg-white rounded-full shadow-sm p-1" />
                    ))}
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex flex-col p-4 h-[calc(100%-11rem)]">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                        {product.brand_name || 'Marke'}
                    </span>
                    {/* NEU: Packungsgröße [cite: 18] */}
                    <span className="text-[10px] text-gray-500 font-medium">
                        {offer?.size_text}
                    </span>
                </div>

                <h3 className="font-semibold text-gray-800 leading-snug line-clamp-2 mb-2">
                    {product.global_name}
                </h3>

                <div className="mt-auto">
                    {offer && (
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-gray-900">
                                    {offer.price.toFixed(2)}
                                </span>
                                <span className="text-sm font-medium text-gray-600">{offer.currency}</span>
                            </div>
                            {/* NEU: Grundpreis für besseren Vergleich [cite: 22] */}
                            {offer.base_price && (
                                <span className="text-[10px] text-gray-400">
                                    ({offer.base_price.toFixed(2)}€ / {offer.base_unit})
                                </span>
                            )}
                        </div>
                    )}

                    {offer?.retailer_name && (
                        <p className="text-xs text-gray-400 mt-1 italic">
                            bei {offer.retailer_name}
                        </p>
                    )}
                </div>
            </div>
        </Wrapper>
    )
}