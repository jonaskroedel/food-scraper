export interface Offer {
    offer_id?: string;
    product_url?: string | null;
    price: number;
    currency: string;
    base_price?: number | null;
    base_unit?: string | null;
    retailer_name?: string;
    size_text?: string | null;
}

export interface ProductBadge {
    id: string;
    name: string;
    image_url?: string | null;
}

export interface Product {
    id: string;
    global_name: string;
    brand_name?: string | null;
    image_url?: string | null;
    offers: Offer[];
    badges?: ProductBadge[];
}
