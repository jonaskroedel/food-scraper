type Offer = {
    product_url: string | null
    price: number
    currency: string
    base_price?: number | null
    base_unit?: string | null
    retailer_name?: string
}

export function ProductCard({ product }: { product: any }) {
    const bestOffer: Offer | undefined = product.offers?.[0]
    const href = bestOffer?.product_url
    const Wrapper = href ? 'a' : 'div'

    return (
        <Wrapper
            {...(href
                ? { href, target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            className="
  group
  flex flex-col
  h-[360px]
  w-full

  rounded-2xl
  bg-white
  border border-gray-200
  shadow-sm

  transition-all
  duration-200
  ease-out

  hover:-translate-y-1
  hover:shadow-xl
  hover:border-gray-300
"



        >
            {/* Bild */}
            <div className="h-40 bg-gray-50 flex items-center justify-center rounded-t-xl">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.global_name}
                        className="max-h-full max-w-full object-contain p-3"
                    />
                ) : (
                    <span className="text-xs text-gray-400">Kein Bild</span>
                )}
            </div>



            {/* Content */}
            <div className="flex flex-col gap-1 p-3 text-sm">
                <div className="font-medium line-clamp-2">
                    {product.global_name}
                </div>

                {product.brand_name && (
                    <div className="text-xs text-gray-500">
                        {product.brand_name}
                    </div>
                )}

                <div className="mt-auto">
                    {product.offers?.[0] && (
                        <>
                            <div className="text-base font-semibold text-green-700">
                                {product.offers[0].price.toFixed(2)}{' '}
                                {product.offers[0].currency}
                            </div>

                            {product.offers[0].base_price && (
                                <div className="text-xs text-gray-500">
                                    {product.offers[0].base_price.toFixed(2)}{' '}
                                    {product.offers[0].currency}/{product.offers[0].base_unit}
                                </div>
                            )}
                        </>
                    )}

                    <div className="text-[11px] text-gray-400 mt-1">
                        {product.offers?.[0]?.retailer_name}
                    </div>
                </div>
            </div>
        </Wrapper>
    )
}
