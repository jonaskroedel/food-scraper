import { normalizeSize } from '../../normalizer/sizeNormalizer';
import type { NormalizedProduct } from '../scraperTypes';

export function normalizeBillaHit(raw: any): NormalizedProduct {
    const rawPriceCents = raw.price?.regular?.value;
    const priceEur = typeof rawPriceCents === 'number' ? Number((rawPriceCents / 100).toFixed(2)) : null;

    const basePriceCents = raw.price?.regular?.perStandardizedQuantity;
    let basePriceEur = typeof basePriceCents === 'number' ? basePriceCents / 100 : null;
    const baseUnitShort = raw.price?.baseUnitShort ?? 'kg';

    // In Billa API, basePriceFactor might be 500 (e.g. 500ml), so 1L is double
    if (raw.price?.basePriceFactor === '500' && basePriceEur) {
        basePriceEur *= 2;
    }

    const sizeText = raw.volumeLabelLong ?? raw.packageLabel ?? `${raw.weight ?? ''}`.trim() ?? null;
    const normSize = normalizeSize(sizeText, priceEur, basePriceEur, baseUnitShort);

    const brand = raw.brand?.name ?? null;
    const name = raw.name ?? `BILLA PRODUCT ${raw.sku}`;

    const imageUrl = Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : null;

    const badges: string[] = [];
    const badgeImages: Record<string, string> = {};

    if (Array.isArray(raw.badges)) {
        for (const b of raw.badges) {
            if (typeof b === 'string') {
                badges.push(b);
            }
        }
    }
    if (raw.keyLabels && Array.isArray(raw.keyLabels)) {
        badges.push(...raw.keyLabels);
    }

    return {
        chain: 'BILLA',
        externalId: String(raw.sku ?? raw.productId ?? raw.slug),
        brand,
        name,
        sizeText,
        price: priceEur,
        currency: 'EUR',
        normalizedQuantity: normSize.quantity,
        normalizedUnit: normSize.unit,
        pricePerBase: normSize.pricePerBase,
        productUrl: raw.slug ? `https://shop.billa.at/produkte/${raw.slug}` : 'https://shop.billa.at',
        imageUrl,
        badges,
        badgeImages,
        categoryPaths: raw.category ? [raw.category] : [],
        fetchedAt: raw.fetchedAt ?? new Date().toISOString(),
        raw,
    };
}
