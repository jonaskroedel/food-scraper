import { normalizeSize } from '../../normalizer/sizeNormalizer';
import type { NormalizedProduct } from '../scraperTypes';

export function normalizeLidlHit(raw: any): NormalizedProduct {
    const data = raw.gridbox?.data ?? raw;
    const name = data.fullTitle ?? data.title ?? raw.label ?? `LIDL PRODUCT ${raw.code}`;

    const price = typeof data.price?.price === 'number' ? data.price.price : null;
    const basePriceText = data.price?.basePrice?.text ?? null;

    // Parse basePrice from text like "(1 kg = 8.90)" or "1 l = 1.49"
    let basePrice: number | null = null;
    let baseUnit = 'kg';

    if (basePriceText) {
        const bpMatch = basePriceText.match(/1\s*(kg|l|stk)\s*=\s*([\d.,]+)/i);
        if (bpMatch) {
            baseUnit = bpMatch[1].toLowerCase();
            basePrice = parseFloat(bpMatch[2].replace(',', '.'));
        }
    }

    // Parse product quantity from title/name first, with basePrice / baseUnit as calculation fallback
    const normSize = normalizeSize(name, price, basePrice, baseUnit);

    const brand = data.brand?.showBrand && data.brand?.name ? data.brand.name : null;
    const imageUrl = typeof data.image === 'string' && data.image.startsWith('http') ? data.image : null;

    const badges: string[] = [];
    if (data.badges?.length) {
        for (const b of data.badges) {
            if (b.name) badges.push(b.name);
        }
    }
    if (name.toLowerCase().includes('bio')) {
        badges.push('Bio');
    }

    const productUrl = data.canonicalPath
        ? `https://www.lidl.at${data.canonicalPath}`
        : `https://www.lidl.at/q/search?q=${encodeURIComponent(name)}`;

    return {
        chain: 'LIDL',
        externalId: String(raw.code ?? data.code),
        brand,
        name,
        sizeText: normSize.displayQuantity && normSize.displayUnit ? `${normSize.displayQuantity} ${normSize.displayUnit}` : null,
        price,
        currency: data.price?.currencyCode ?? 'EUR',
        normalizedQuantity: normSize.quantity,
        normalizedUnit: normSize.unit,
        pricePerBase: normSize.pricePerBase,
        productUrl,
        imageUrl,
        badges,
        badgeImages: {},
        categoryPaths: data.keyfacts?.wonCategoryPrimary ? [data.keyfacts.wonCategoryPrimary] : [],
        fetchedAt: new Date().toISOString(),
        raw,
    };
}
