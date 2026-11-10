export interface MatchMeta {
    isBio: boolean;
    cleanName: string;
    detectedBrand: string | null;
    matchKey: string;
}

const BIO_KEYWORDS = [
    'bio',
    'biologisch',
    'ökologisch',
    'ja! natürlich',
    'ja natuerlich',
    'zurück zum ursprung',
    'zurueck zum ursprung',
    'natur*pur',
    'natur pur',
    'alnatura',
    'demeter',
    'bioland',
];

const KNOWN_BRANDS = [
    'Ja! Natürlich',
    'Clever',
    'SPAR Natur*pur',
    'SPAR Premium',
    'SPAR Vital',
    'S-BUDGET',
    'SPAR',
    'Zurück zum Ursprung',
    'Milsani',
    'Milfina',
    'Good Choice',
    'Milbona',
    'K-Classic',
    'Alnatura',
    'Manner',
    'Gösser',
    'Puntigamer',
    'Stiegl',
    'Wieselburger',
    'Zipfer',
    'Vöslauer',
    'Römerquelle',
    'Red Bull',
    'Coca-Cola',
    'Coca Cola',
    'Barilla',
    'Knorr',
    'Maggi',
    'Inzersdorfer',
    'Kellys',
    'Milka',
    'Lindt',
    'Ferrero',
    'Nutella',
];

export function isBio(name: string, brand?: string | null, badges?: string[]): boolean {
    const combined = `${name} ${brand ?? ''} ${(badges ?? []).join(' ')}`.toLowerCase();
    return BIO_KEYWORDS.some(kw => combined.includes(kw));
}

export function extractBrand(name: string, existingBrand?: string | null): string | null {
    if (existingBrand && existingBrand.trim()) {
        return existingBrand.trim();
    }

    for (const b of KNOWN_BRANDS) {
        const regex = new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(name)) {
            return b;
        }
    }

    return null;
}

export function cleanProductName(name: string, brand?: string | null): string {
    let clean = name.trim();

    // Strip brand from title if present at start
    if (brand) {
        const brandRegex = new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-:]?\\s*`, 'i');
        clean = clean.replace(brandRegex, '');
    }

    // Strip trailing pack sizes like "500g", "1kg", "1l", "12 Stk."
    clean = clean.replace(/\s+(?:\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|stk|stück))\s*$/i, '');

    // Strip common filler words
    clean = clean.replace(/\s+(?:vorteilspack|vorratspackung|multipack|aktion|xxl)\b/gi, '');

    // Clean whitespace
    return clean.replace(/\s+/g, ' ').trim();
}

export function generateMatchKey(
    name: string,
    brand?: string | null,
    quantity?: number | null,
    unit?: string | null
): string {
    const isOrganic = isBio(name, brand);
    const cleaned = cleanProductName(name, brand)
        .toLowerCase()
        .replace(/[^\w\säöüß-]/g, '')
        .replace(/\s+/g, '-');

    const bioPrefix = isOrganic ? 'bio-' : '';
    const sizeSuffix = quantity && unit ? `-${Math.round(quantity)}${unit}` : '';

    return `${bioPrefix}${cleaned}${sizeSuffix}`;
}

export function analyzeProduct(
    name: string,
    brand?: string | null,
    badges?: string[],
    quantity?: number | null,
    unit?: string | null
): MatchMeta {
    const isOrganic = isBio(name, brand, badges);
    const detectedBrand = extractBrand(name, brand);
    const cleaned = cleanProductName(name, detectedBrand);
    const matchKey = generateMatchKey(cleaned, detectedBrand, quantity, unit);

    return {
        isBio: isOrganic,
        cleanName: cleaned,
        detectedBrand,
        matchKey,
    };
}
