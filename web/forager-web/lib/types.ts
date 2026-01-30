export type ProductOfferDTO = {
    offer_id: string
    retailer_code: string
    retailer_name: string
    price: number
    currency: string
    base_price: number | null
    base_unit: string | null
}

type ProductDTO = {
    id: string
    global_name: string
    brand_name: string | null

    image_url: string | null

    badges: {
        id: string
        name: string
        image_url: string | null
    }[]

    offers: {
        retailer_name: string
        price: number
        currency: string
    }[]
}
