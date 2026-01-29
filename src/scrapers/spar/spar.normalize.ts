import { parseSize } from '../../utils/units.js';
import { NormalizedProduct } from './spar.types.js';

export function normalizeSparHit(hit: any): NormalizedProduct {
    const mv = hit.masterValues;
    const geo = mv?.geoInformation?.[0]?.geoValues;

    const globalName =
        mv?.name2?.trim()
        || mv?.slug?.replace(/-/g, ' ')
        || mv?.name1?.trim()
        || `SPAR PRODUCT ${mv?.productId}`;

    const { quantity, unit } = parseSize(mv?.name3);

    let pricePerBase: number | null = null;
    if (quantity && unit && geo?.calculatedPrice) {
        if (unit === 'g' || unit === 'ml') {
            pricePerBase = geo.calculatedPrice / quantity * 1000;
        } else if (unit === 'stk') {
            pricePerBase = geo.calculatedPrice;
        }
    }

    const badgeNames: string[] = mv?.badgeAltTexts_plp ?? [];
    const badgeUrls: string[] = mv?.badgeDamUrls_plp ?? [];

    const badgeImages: Record<string, string> = {};
    for (let i = 0; i < badgeNames.length; i++) {
        if (badgeUrls[i]) {
            badgeImages[badgeNames[i]] = badgeUrls[i];
        }
    }

    return {
        chain: 'SPAR',
        externalId: mv.productId,

        brand: mv.name1 ?? null,
        name: globalName,
        sizeText: mv.name3 ?? null,

        price: geo?.calculatedPrice ?? null,
        currency: mv?.regularPriceCurrency ?? null,

        normalizedQuantity: quantity,
        normalizedUnit: unit,
        pricePerBase,

        productUrl: `https://www.spar.at/produktwelt/${mv.slug}`,
        imageUrl: mv?.productImage_assetUrl
            ? mv.productImage_assetUrl
                .replace('{size}', '500')
                .replace('{ext}', 'jpg')
            : null,

        badges: badgeNames,
        badgeImages,

        categoryPaths: hit?.pwCategoryPathIDs ?? [],

        fetchedAt: new Date().toISOString(),
        raw: hit,
    };
}