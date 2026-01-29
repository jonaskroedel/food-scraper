export interface RawProduct {
    chain: string;
    externalId: string;

    rawName: string;
    rawPrice: number | null;
    rawUnitPrice: number | null;

    rawWeightText: string | null;
    rawCategory: string | null;

    rawIngredients: string | null;
    rawNutrition: string | null;

    rawPayload: unknown;
    productUrl: string;
    scrapedAt: Date;
}
