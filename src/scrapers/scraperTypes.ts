export type RetailerCode = 'SPAR' | 'BILLA' | 'HOFER' | 'LIDL';

export interface NormalizedProduct {
    chain: RetailerCode;
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

    categoryPaths?: string[];

    fetchedAt: string;
    raw?: any;
}

export interface ScraperOptions {
    maxPages?: number;
    startPage?: number;
    batchSize?: number;
    categories?: string[];
    dumpToFile?: boolean;
    outputFile?: string;
}

export interface ScraperResult {
    retailer: RetailerCode;
    totalFetched: number;
    totalUpserted: number;
    durationMs: number;
    errors: number;
    dumpFilePath?: string;
}

export interface RetailerScraper {
    readonly retailerCode: RetailerCode;
    readonly displayName: string;
    run(options?: ScraperOptions): Promise<ScraperResult>;
}
