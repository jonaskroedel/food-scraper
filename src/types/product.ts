export interface Offer {
    product_url?: string | null;
    price: number;
    currency: string;
    base_price?: number | null;
    base_unit?: string | null;
    retailer_name?: string;
}

export interface Product {
    id: string;
    global_name: string;
    brand_name?: string;
    image_url?: string;
    offers: Offer[];
    badges?: Array<{ id: string; image_url: string; name: string }>;
}