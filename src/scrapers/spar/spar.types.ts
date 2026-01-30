export interface SparRawHit {
    masterValues: any;
    pwCategoryPathIDs?: string[];
}

export interface NormalizedProduct {
    chain: 'SPAR';
    externalId: string;

    brand: string | null;
    name: string;
    sizeText: string | null;

    price: number | null;
    currency: string | null;

    normalizedQuantity: number | null;
    normalizedUnit: 'g' | 'ml' | 'stk' | null;
    pricePerBase: number | null;

    productUrl: string;
    imageUrl: string | null;

    badges: string[];
    badgeImages: Record<string, string>;

    categoryPaths: string[];

    fetchedAt: string;
    raw: any;
}
