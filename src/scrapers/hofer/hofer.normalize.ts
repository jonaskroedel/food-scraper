import { normalizeSize } from '../../normalizer/sizeNormalizer';
import type { NormalizedProduct } from '../scraperTypes';

export function normalizeHoferHit(raw: any): NormalizedProduct {
    // If it's already normalized, return as-is
    if (raw.chain && raw.externalId) {
        return raw as NormalizedProduct;
    }

    // Modern Hofer Commerce API (asl.api.hofer.at)
    if (raw.sku) {
        const name = raw.name ?? `HOFER PRODUKT ${raw.sku}`;
        const brand = raw.brandName ?? null;
        const sizeText = raw.sellingSize ?? null;

        const price = typeof raw.price?.amountRelevant === 'number'
            ? raw.price.amountRelevant / 100
            : typeof raw.price?.amount === 'number'
            ? raw.price.amount / 100
            : null;

        const basePrice = typeof raw.price?.comparison === 'number'
            ? raw.price.comparison / 100
            : null;

        const normSize = normalizeSize(sizeText || name, price, basePrice, raw.contentUnit);

        const badges: string[] = [];
        if (Array.isArray(raw.badges)) {
            for (const b of raw.badges) {
                if (Array.isArray(b.items)) {
                    for (const item of b.items) {
                        if (item.displayText) badges.push(item.displayText);
                    }
                }
            }
        }
        if (name.toLowerCase().includes('bio') || (brand && brand.toLowerCase().includes('ursprung'))) {
            if (!badges.some(b => b.toLowerCase().includes('bio'))) {
                badges.unshift('Bio');
            }
        }

        const productUrl = raw.urlSlugText
            ? `https://www.hofer.at/produkt/${raw.urlSlugText}-${raw.sku}`
            : `https://www.hofer.at/produkte`;

        let imageUrl: string | null = null;
        if (raw.assets?.[0]?.url) {
            imageUrl = raw.assets[0].url
                .replace('{width}', '500')
                .replace('{slug}', raw.urlSlugText || 'product');
        }

        return {
            chain: 'HOFER',
            externalId: String(raw.sku),
            brand,
            name,
            sizeText,
            price,
            currency: raw.price?.currencyCode ?? 'EUR',
            normalizedQuantity: normSize.quantity,
            normalizedUnit: normSize.unit,
            pricePerBase: normSize.pricePerBase,
            productUrl,
            imageUrl,
            badges,
            badgeImages: {},
            categoryPaths: Array.isArray(raw.categories) ? raw.categories.map((c: any) => c.name || String(c)) : [],
            fetchedAt: new Date().toISOString(),
            raw,
        };
    }

    // Legacy Roksh fallback
    const provider = Array.isArray(raw.productProvider) ? raw.productProvider[0] : null;
    const name = raw.productName ?? raw.ProductName ?? provider?.providerProductName ?? `HOFER PRODUKT ${raw.productID}`;
    const brand = raw.brand ?? null;
    const price = typeof raw.price === 'number'
        ? raw.price
        : typeof provider?.price === 'number'
        ? provider.price
        : null;
    const sizeText = raw.displayUnit
        ? `${raw.minWeightStep ?? ''} ${raw.displayUnit}`.trim()
        : provider?.unit
        ? `${provider.unit}`.trim()
        : null;
    const normSize = normalizeSize(name, price, raw.unitPrice ?? provider?.unitPrice, raw.priceUnitType ?? provider?.unit);

    return {
        chain: 'HOFER',
        externalId: String(raw.productID ?? raw.productId ?? Math.random()),
        brand,
        name,
        sizeText,
        price,
        currency: 'EUR',
        normalizedQuantity: normSize.quantity,
        normalizedUnit: normSize.unit,
        pricePerBase: normSize.pricePerBase,
        productUrl: `https://www.hofer.at/produkte`,
        imageUrl: raw.mediaUrlM ?? raw.mediaUrlL ?? null,
        badges: name.toLowerCase().includes('bio') ? ['Bio'] : [],
        badgeImages: {},
        categoryPaths: raw.category ? [raw.category] : [],
        fetchedAt: new Date().toISOString(),
        raw,
    };
}
